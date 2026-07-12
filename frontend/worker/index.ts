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

const json = (data: unknown, status = 200) =>
    Response.json(data, {
        status,
        headers: { "Cache-Control": "no-store" },
    });
const error = (detail: string, status: number) => json({ detail }, status);

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
        try {
            const url = new URL(request.url);
            let segments: string[];
            try {
                segments = url.pathname
                    .split("/")
                    .filter(Boolean)
                    .map(decodeURIComponent);
            } catch {
                return env.ASSETS.fetch(request);
            }
            const [first, second, third, fourth, fifth] = segments;

            if (request.method === "POST") {
                if (
                    segments.length === 5 &&
                    first === "quizzes" &&
                    third === "questions" &&
                    fifth === "answer"
                ) {
                    const sql = neon(env.DATABASE_URL);
                    return await submitAnswer(sql, request, second, fourth);
                }
                if (
                    segments.length === 3 &&
                    first === "questions" &&
                    third === "answer"
                ) {
                    const sql = neon(env.DATABASE_URL);
                    return await submitStandaloneAnswer(sql, request, second);
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
