import { apiFetch } from "./api-client";
import type {
    AnswerRequest,
    QuizAnswer,
    QuizQuestion,
    SubmissionResult,
} from "../quiz/types/quiz-types";

export function fetchQuizQuestions(quizSlug: string, signal?: AbortSignal) {
    return apiFetch<QuizQuestion[]>(
        `/${encodeURIComponent(quizSlug)}/questions`,
        { signal },
    );
}

export function submitAnswer(
    quizSlug: string,
    questionId: string,
    request: AnswerRequest,
    signal?: AbortSignal,
) {
    return apiFetch<SubmissionResult>(
        `/${encodeURIComponent(quizSlug)}/${encodeURIComponent(questionId)}/answer`,
        { method: "POST", body: request, signal },
    );
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
            const answerMap: Record<string, string> = {};
            for (const [slot, optionId] of Object.entries(answer.pairs)) {
                if (optionId !== undefined) answerMap[slot] = optionId;
            }
            return { type: "drag-order", answer: answerMap };
        }
        default: {
            const _exhaustive: never = answer;
            return _exhaustive;
        }
    }
}
