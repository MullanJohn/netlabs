import { apiFetch, staticFetch } from "./api-client";
import { slotId } from "../quiz/answer";
import type {
    AnswerRequest,
    QuizAnswer,
    QuizQuestion,
    SubmissionResult,
} from "../quiz/types/quiz-types";

export function fetchQuizQuestions(quizSlug: string, signal?: AbortSignal) {
    return staticFetch<QuizQuestion[]>(
        `/api/quizzes/${encodeURIComponent(quizSlug)}/questions.json`,
        signal,
    );
}

export function fetchQuestion(questionId: string, signal?: AbortSignal) {
    return staticFetch<QuizQuestion>(
        `/api/questions/${encodeURIComponent(questionId)}.json`,
        signal,
    );
}

export function submitAnswer(
    quizSlug: string | null,
    questionId: string,
    request: AnswerRequest,
    signal?: AbortSignal,
) {
    const path = quizSlug
        ? `/quizzes/${encodeURIComponent(quizSlug)}/questions/${encodeURIComponent(questionId)}/answer`
        : `/questions/${encodeURIComponent(questionId)}/answer`;
    return apiFetch<SubmissionResult>(path, {
        method: "POST",
        body: request,
        signal,
    });
}

export function toAnswerRequest(answer: QuizAnswer): AnswerRequest | null {
    switch (answer.type) {
        case "mcq-single":
            return answer.optionId === null
                ? null
                : { type: "mcq-single", answer: answer.optionId };
        case "mcq-multi":
            return { type: "mcq-multi", answer: answer.optionIds };
        case "drag-order": {
            const order: string[] = [];
            for (let i = 0; i < Object.keys(answer.pairs).length; i++) {
                const optionId = answer.pairs[slotId(i)];
                if (optionId === undefined) return null;
                order.push(optionId);
            }
            return { type: "drag-order", answer: order };
        }
        case "matching": {
            const answerMap: Record<string, string> = {};
            for (const [premiseId, optionId] of Object.entries(answer.pairs)) {
                if (optionId !== undefined) answerMap[premiseId] = optionId;
            }
            return { type: "matching", answer: answerMap };
        }
        case "multi-tf":
            return {
                type: "multi-tf",
                answer: Object.entries(answer.verdicts)
                    .filter(([, value]) => value === true)
                    .map(([optionId]) => optionId),
            };
        case "fill-blank": {
            const text = answer.text.trim();
            return text === "" ? null : { type: "fill-blank", answer: text };
        }
        default: {
            const _exhaustive: never = answer;
            return _exhaustive;
        }
    }
}
