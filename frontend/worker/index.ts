import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import {
    HttpError,
    gradeSubmission,
    parseAnswerRequest,
} from "./grading";

export interface Env {
    DATABASE_URL: string;
    ASSETS: Fetcher;
}

type Sql = NeonQueryFunction<false, false>;

const QUESTION_ROW_SELECT = `
SELECT
    q.id,
    q.topic_id,
    q.sub_topic_id,
    q.question_type,
    q.select_count,
    q.premises,
    q.stem,
    CASE
        WHEN q.exhibit_type IS NULL THEN NULL
        ELSE jsonb_build_object('type', q.exhibit_type, 'content', q.exhibit_content)
    END AS exhibit,
    COALESCE(
        jsonb_agg(
            jsonb_build_object('id', qo.option_id, 'text', qo.text)
            ORDER BY qo.position
        ) FILTER (WHERE qo.option_id IS NOT NULL),
        '[]'::jsonb
    ) AS options
FROM questions q
LEFT JOIN question_options qo ON qo.question_id = q.id
`;

const QUESTION_ROW_GROUP_BY = `
GROUP BY
    q.id,
    q.topic_id,
    q.sub_topic_id,
    q.question_type,
    q.select_count,
    q.premises,
    q.stem,
    q.exhibit_type,
    q.exhibit_content
`;

const json = (data: unknown, status = 200) => Response.json(data, { status });
const error = (detail: string, status: number) => json({ detail }, status);

function questionFromRow(row: Record<string, unknown>): Record<string, unknown> {
    const question = { ...row };
    if (question.select_count === null) delete question.select_count;
    if (question.premises === null) delete question.premises;
    return question;
}

function catalogDrill(row: Record<string, unknown>) {
    const slug = String(row.slug);
    return {
        slug,
        name: row.name,
        description: row.description,
        href: `/quiz?quiz=${encodeURIComponent(slug)}`,
        quiz_slug: slug,
        item_count: row.item_count,
    };
}

async function listQuizzes(sql: Sql): Promise<Response> {
    const rows = await sql`
        SELECT slug,
               name,
               description,
               track_slug,
               kind,
               subkind,
               bank,
               time_limit_minutes
        FROM quiz_templates
        ORDER BY slug
    `;
    return json(rows);
}

async function listCatalogCategories(
    sql: Sql,
    trackSlug: string,
): Promise<Response> {
    const rows = await sql`
        SELECT kind AS slug
        FROM quiz_templates qt
        WHERE qt.track_slug = ${trackSlug}
        GROUP BY kind
        ORDER BY kind
    `;
    return json({ categories: rows });
}

async function listCatalogDrills(
    sql: Sql,
    trackSlug: string,
    categorySlug: string,
    limit: number | null,
): Promise<Record<string, unknown>[]> {
    const rows = await sql`
        SELECT qt.slug,
               qt.name,
               qt.description,
               COUNT(qti.question_id)::int AS item_count
        FROM quiz_templates qt
        LEFT JOIN quiz_template_items qti ON qti.template_slug = qt.slug
        WHERE qt.track_slug = ${trackSlug}
          AND qt.kind = ${categorySlug}
        GROUP BY qt.slug, qt.name, qt.description
        ORDER BY qt.slug
        LIMIT ${limit === null ? 1_000_000 : limit}
    `;
    return rows.map(catalogDrill);
}

async function listQuizQuestions(sql: Sql, quizSlug: string): Promise<Response> {
    const rows = await sql.query(
        `${QUESTION_ROW_SELECT}
        JOIN quiz_template_items qti ON qti.question_id = q.id
        WHERE qti.template_slug = $1
        ${QUESTION_ROW_GROUP_BY},
            qti.position
        ORDER BY qti.position`,
        [quizSlug],
    );
    if (rows.length === 0) return error("Quiz not found", 404);
    return json(rows.map(questionFromRow));
}

async function submitAnswer(
    sql: Sql,
    request: Request,
    quizSlug: string,
    questionId: string,
): Promise<Response> {
    const rows = await sql`
        SELECT q.question_type, q.answer, q.rationale
        FROM questions q
        JOIN quiz_template_items qti ON qti.question_id = q.id
        WHERE q.id = ${questionId}
          AND qti.template_slug = ${quizSlug}
    `;
    const row = rows[0];
    if (!row) return error("Question not found in quiz", 404);

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return error("Invalid answer payload", 400);
    }
    const submission = parseAnswerRequest(body);
    if (submission.type !== row.question_type) {
        return error("Answer type does not match question type", 400);
    }
    const result = gradeSubmission(
        submission,
        row.answer,
        String(row.rationale),
    );
    return json(result);
}

export default {
    async fetch(request, env): Promise<Response> {
        const url = new URL(request.url);
        const segments = url.pathname
            .split("/")
            .filter(Boolean)
            .map(decodeURIComponent);
        const [first, second, third, fourth, fifth] = segments;

        try {
            const sql = neon(env.DATABASE_URL);

            if (request.method === "GET" && first === "quizzes") {
                if (segments.length === 1) return await listQuizzes(sql);
                if (segments.length === 3 && third === "questions") {
                    return await listQuizQuestions(sql, second);
                }
            }
            if (
                request.method === "POST" &&
                segments.length === 5 &&
                first === "quizzes" &&
                third === "questions" &&
                fifth === "answer"
            ) {
                return await submitAnswer(sql, request, second, fourth);
            }
            if (
                request.method === "GET" &&
                first === "catalog" &&
                third === "categories"
            ) {
                if (segments.length === 3) {
                    return await listCatalogCategories(sql, second);
                }
                if (segments.length === 5 && fifth === "preview") {
                    return json({
                        category_slug: fourth,
                        items: await listCatalogDrills(sql, second, fourth, 3),
                    });
                }
                if (segments.length === 5 && fifth === "drills") {
                    return json({
                        category_slug: fourth,
                        drills: await listCatalogDrills(sql, second, fourth, null),
                    });
                }
            }

            return env.ASSETS.fetch(request);
        } catch (err) {
            if (err instanceof HttpError) return error(err.detail, err.status);
            console.error(err);
            return error("Internal server error", 500);
        }
    },
} satisfies ExportedHandler<Env>;
