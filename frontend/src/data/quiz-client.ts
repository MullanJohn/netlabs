import { apiFetch } from "./api-client";
import type {
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
    answer: QuizAnswer,
    signal?: AbortSignal,
) {
    return apiFetch<SubmissionResult>(
        `/${encodeURIComponent(quizSlug)}/${encodeURIComponent(questionId)}/answer`,
        { method: "POST", body: answer, signal },
    );
}
