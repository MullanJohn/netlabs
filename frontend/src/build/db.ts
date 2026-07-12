import { Pool } from "pg";
import type { BankQuestionListResponse } from "../data/bank-types";
import type { CatalogDrill } from "../data/catalog-types";
import { trackSelectors } from "../data/track-selectors";
import type { QuizQuestion } from "../quiz/types/quiz-types";

const PUBLISHED_TRACKS = Object.keys(trackSelectors);

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL is required to build static question data");
}

const pool = new Pool({ connectionString, max: 4, allowExitOnIdle: true });

const QUESTION_FIELDS = `
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
`;

const QUESTION_GROUP_BY = `
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

function questionFromRow(row: Record<string, unknown>): QuizQuestion {
    const question = { ...row };
    if (question.select_count === null) delete question.select_count;
    if (question.premises === null) delete question.premises;
    if (question.exhibit === null) delete question.exhibit;
    return question as QuizQuestion;
}

export async function loadQuizQuestionSets(): Promise<
    Map<string, QuizQuestion[]>
> {
    const { rows } = await pool.query(
        `SELECT qti.template_slug, ${QUESTION_FIELDS}
        FROM questions q
        LEFT JOIN question_options qo ON qo.question_id = q.id
        JOIN quiz_template_items qti ON qti.question_id = q.id
        JOIN quiz_templates qt ON qt.slug = qti.template_slug
        WHERE qt.track_slug = ANY($1)
        ${QUESTION_GROUP_BY},
            qti.template_slug,
            qti.position
        ORDER BY qti.template_slug, qti.position`,
        [PUBLISHED_TRACKS],
    );
    const sets = new Map<string, QuizQuestion[]>();
    for (const { template_slug, ...row } of rows) {
        const slug = String(template_slug);
        const questions = sets.get(slug) ?? [];
        questions.push(questionFromRow(row));
        sets.set(slug, questions);
    }
    return sets;
}

export async function loadAllQuestions(): Promise<QuizQuestion[]> {
    const { rows } = await pool.query(
        `SELECT ${QUESTION_FIELDS}
        FROM questions q
        LEFT JOIN question_options qo ON qo.question_id = q.id
        WHERE q.track_slug = ANY($1)
        ${QUESTION_GROUP_BY}
        ORDER BY q.id`,
        [PUBLISHED_TRACKS],
    );
    return rows.map(questionFromRow);
}

export async function loadBankQuestions(
    trackSlug: string,
): Promise<BankQuestionListResponse> {
    const { rows } = await pool.query(
        `SELECT q.id,
                q.topic_id,
                q.sub_topic_id,
                q.question_type,
                q.stem
        FROM questions q
        WHERE q.track_slug = $1
        ORDER BY q.id`,
        [trackSlug],
    );
    return { total: rows.length, questions: rows };
}

export async function loadCatalogDrills(
    trackSlug: string,
    categorySlug: string,
    limit: number | null,
): Promise<CatalogDrill[]> {
    const { rows } = await pool.query(
        `SELECT qt.slug,
                qt.name,
                qt.description,
                COUNT(qti.question_id)::int AS item_count
        FROM quiz_templates qt
        LEFT JOIN quiz_template_items qti ON qti.template_slug = qt.slug
        WHERE qt.track_slug = $1
          AND qt.kind = $2
        GROUP BY qt.slug, qt.name, qt.description
        ORDER BY qt.slug`,
        [trackSlug, categorySlug],
    );
    rows.sort((a, b) =>
        String(a.slug).localeCompare(String(b.slug), undefined, {
            numeric: true,
        }),
    );
    const limited = limit === null ? rows : rows.slice(0, limit);
    return limited.map((row) => ({
        name: row.name,
        description: row.description,
        href: `/quiz?quiz=${encodeURIComponent(String(row.slug))}`,
        item_count: row.item_count,
    }));
}
