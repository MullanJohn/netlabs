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

const QUESTION_TYPES = new Set([
    "mcq-single",
    "mcq-multi",
    "drag-order",
    "matching",
    "multi-tf",
    "fill-blank",
]);

const json = (data: unknown, status = 200) => Response.json(data, { status });
const error = (detail: string, status: number) => json({ detail }, status);

function questionFromRow(row: Record<string, unknown>): Record<string, unknown> {
    const question = { ...row };
    if (question.select_count === null) delete question.select_count;
    if (question.premises === null) delete question.premises;
    return question;
}

function naturalSlugCompare(
    a: Record<string, unknown>,
    b: Record<string, unknown>,
): number {
    return String(a.slug).localeCompare(String(b.slug), undefined, {
        numeric: true,
    });
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
    rows.sort(naturalSlugCompare);
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
    `;
    rows.sort(naturalSlugCompare);
    const limited = limit === null ? rows : rows.slice(0, limit);
    return limited.map(catalogDrill);
}

async function listBankQuestions(sql: Sql, url: URL): Promise<Response> {
    const track = url.searchParams.get("track");
    if (!track) return error("Missing track parameter", 400);
    const type = url.searchParams.get("type");
    if (type && !QUESTION_TYPES.has(type)) {
        return error("Invalid question type", 400);
    }
    const domain = url.searchParams.get("domain");
    const search = url.searchParams.get("q");

    const params: unknown[] = [track];
    const clauses: string[] = [];
    if (domain) {
        params.push(domain);
        clauses.push(`AND q.topic_id = $${params.length}`);
    }
    if (type) {
        params.push(type);
        clauses.push(`AND q.question_type = $${params.length}`);
    }
    if (search) {
        params.push(`%${search.replace(/[\\%_]/g, (char) => `\\${char}`)}%`);
        clauses.push(
            `AND (q.stem ILIKE $${params.length}
                  OR q.id ILIKE $${params.length}
                  OR q.sub_topic_id ILIKE $${params.length})`,
        );
    }
    const filterParamCount = params.length;
    let paging = "";
    const limit = Number.parseInt(url.searchParams.get("limit") ?? "", 10);
    if (Number.isFinite(limit)) {
        params.push(Math.min(1000, Math.max(1, limit)));
        paging += ` LIMIT $${params.length}`;
    }
    const offset = Number.parseInt(url.searchParams.get("offset") ?? "", 10);
    if (Number.isFinite(offset) && offset > 0) {
        params.push(offset);
        paging += ` OFFSET $${params.length}`;
    }

    const filterSql = `
        FROM questions q
        WHERE q.track_slug = $1
        ${clauses.join("\n        ")}`;

    const rows = await sql.query(
        `SELECT q.id,
                q.topic_id,
                q.sub_topic_id,
                q.question_type,
                q.stem
        ${filterSql}
        ORDER BY q.id${paging}`,
        params,
    );
    let total = rows.length;
    if (paging) {
        const counted = await sql.query(
            `SELECT COUNT(*)::int AS total ${filterSql}`,
            params.slice(0, filterParamCount),
        );
        total = Number(counted[0].total);
    }
    return json({ total, questions: rows });
}

async function getQuestion(sql: Sql, questionId: string): Promise<Response> {
    const rows = await sql.query(
        `${QUESTION_ROW_SELECT}
        WHERE q.id = $1
        ${QUESTION_ROW_GROUP_BY}`,
        [questionId],
    );
    const row = rows[0];
    if (!row) return error("Question not found", 404);
    return json(questionFromRow(row));
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

async function sampleQuizQuestions(
    sql: Sql,
    quizSlug: string,
    url: URL,
): Promise<Response> {
    const count = Math.min(
        10,
        Math.max(
            1,
            Number.parseInt(url.searchParams.get("count") ?? "", 10) || 3,
        ),
    );
    const typesParam = url.searchParams.get("types");
    let types: string[] = [];
    if (typesParam) {
        types = typesParam
            .split(",")
            .map((value) => value.trim())
            .filter((value) => QUESTION_TYPES.has(value));
        if (types.length === 0) return error("Invalid question types", 400);
    }
    const typeFilter =
        types.length > 0 ? "AND q.question_type = ANY($2)" : "";
    const limitParam = types.length > 0 ? "$3" : "$2";
    const params: unknown[] =
        types.length > 0 ? [quizSlug, types, count] : [quizSlug, count];
    const rows = await sql.query(
        `${QUESTION_ROW_SELECT}
        JOIN quiz_template_items qti ON qti.question_id = q.id
        WHERE qti.template_slug = $1
        ${typeFilter}
        ${QUESTION_ROW_GROUP_BY}
        ORDER BY random()
        LIMIT ${limitParam}`,
        params,
    );
    if (rows.length === 0) return error("Quiz not found", 404);
    return json(rows.map(questionFromRow));
}

async function gradeAnswerRow(
    request: Request,
    row: Record<string, unknown>,
): Promise<Response> {
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
    return gradeAnswerRow(request, row);
}

async function submitStandaloneAnswer(
    sql: Sql,
    request: Request,
    questionId: string,
): Promise<Response> {
    const rows = await sql`
        SELECT q.question_type, q.answer, q.rationale
        FROM questions q
        WHERE q.id = ${questionId}
    `;
    const row = rows[0];
    if (!row) return error("Question not found", 404);
    return gradeAnswerRow(request, row);
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
                if (
                    segments.length === 4 &&
                    third === "questions" &&
                    fourth === "sample"
                ) {
                    return await sampleQuizQuestions(sql, second, url);
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
            if (first === "questions") {
                if (request.method === "GET" && segments.length === 1) {
                    return await listBankQuestions(sql, url);
                }
                if (request.method === "GET" && segments.length === 2) {
                    return await getQuestion(sql, second);
                }
                if (
                    request.method === "POST" &&
                    segments.length === 3 &&
                    third === "answer"
                ) {
                    return await submitStandaloneAnswer(sql, request, second);
                }
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
