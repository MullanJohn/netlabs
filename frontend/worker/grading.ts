export class HttpError extends Error {
    constructor(
        readonly status: number,
        readonly detail: string,
    ) {
        super(detail);
    }
}

export type AnswerRequest =
    | { type: "mcq-single"; answer: string }
    | { type: "mcq-multi"; answer: string[] }
    | { type: "drag-order"; answer: string[] }
    | { type: "matching"; answer: Record<string, string> }
    | { type: "multi-tf"; answer: string[] }
    | { type: "fill-blank"; answer: string };

export type SubmissionResult = {
    type: AnswerRequest["type"];
    isCorrect: boolean;
    explanation: string;
} & (
    | { correctOptionIds: string[] }
    | { correctOrder: string[] }
    | { correctPairs: Record<string, string> }
    | { acceptedAnswers: string[] }
);

const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((item) => typeof item === "string");

const isStringRecord = (value: unknown): value is Record<string, string> =>
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((item) => typeof item === "string");

export function parseAnswerRequest(body: unknown): AnswerRequest {
    const invalid = new HttpError(400, "Invalid answer payload");
    if (typeof body !== "object" || body === null) throw invalid;
    const { type, answer } = body as { type?: unknown; answer?: unknown };
    switch (type) {
        case "mcq-single":
        case "fill-blank":
            if (typeof answer !== "string") throw invalid;
            return { type, answer };
        case "mcq-multi":
        case "multi-tf":
        case "drag-order":
            if (!isStringArray(answer)) throw invalid;
            return { type, answer };
        case "matching":
            if (!isStringRecord(answer)) throw invalid;
            return { type, answer };
        default:
            throw invalid;
    }
}

const malformedKey = () => new HttpError(500, "Malformed question data");

function correctList(key: unknown): string[] {
    if (typeof key !== "object" || key === null) throw malformedKey();
    const correct = (key as { correct?: unknown }).correct;
    if (!isStringArray(correct) || correct.length === 0) throw malformedKey();
    return correct;
}

function correctMap(key: unknown): Record<string, string> {
    if (typeof key !== "object" || key === null) throw malformedKey();
    const correct = (key as { correct?: unknown }).correct;
    if (!isStringRecord(correct)) throw malformedKey();
    return Object.fromEntries(
        Object.entries(correct).map(([k, v]) => [String(k), String(v)]),
    );
}

function acceptedList(key: unknown): string[] {
    if (typeof key !== "object" || key === null) throw malformedKey();
    const accepted = (key as { accepted?: unknown }).accepted;
    if (!isStringArray(accepted) || accepted.length === 0) throw malformedKey();
    return accepted;
}

const setEqual = (a: string[], b: string[]): boolean => {
    const sa = new Set(a);
    const sb = new Set(b);
    return sa.size === sb.size && [...sa].every((item) => sb.has(item));
};

const normalizeText = (value: string): string =>
    value.split(/\s+/).filter(Boolean).join(" ").toLowerCase();

export function gradeSubmission(
    submission: AnswerRequest,
    keyJson: unknown,
    explanation: string,
): SubmissionResult {
    switch (submission.type) {
        case "mcq-single": {
            const correct = correctList(keyJson);
            return {
                type: submission.type,
                isCorrect: submission.answer === correct[0],
                correctOptionIds: correct,
                explanation,
            };
        }
        case "mcq-multi":
        case "multi-tf": {
            const correct = correctList(keyJson);
            return {
                type: submission.type,
                isCorrect: setEqual(submission.answer, correct),
                correctOptionIds: correct,
                explanation,
            };
        }
        case "drag-order": {
            const correct = correctList(keyJson);
            if (submission.answer.length !== correct.length) {
                throw new HttpError(
                    400,
                    "Answer must order exactly the question's options",
                );
            }
            return {
                type: submission.type,
                isCorrect: submission.answer.every(
                    (optionId, index) => optionId === correct[index],
                ),
                correctOrder: correct,
                explanation,
            };
        }
        case "matching": {
            const correct = correctMap(keyJson);
            const submitted = Object.fromEntries(
                Object.entries(submission.answer).map(([k, v]) => [
                    String(k),
                    String(v),
                ]),
            );
            const correctKeys = Object.keys(correct);
            const isCorrect =
                Object.keys(submitted).length === correctKeys.length &&
                correctKeys.every((k) => submitted[k] === correct[k]);
            return {
                type: submission.type,
                isCorrect,
                correctPairs: correct,
                explanation,
            };
        }
        case "fill-blank": {
            const accepted = acceptedList(keyJson);
            const normalized = normalizeText(submission.answer);
            return {
                type: submission.type,
                isCorrect: accepted.some(
                    (candidate) => normalizeText(candidate) === normalized,
                ),
                acceptedAnswers: accepted,
                explanation,
            };
        }
    }
}
