import { useEffect, useState } from "react";
import QuizSession from "./session/QuizSession";
import { fetchQuestion, fetchQuizQuestions } from "../data/quiz-client";
import { ApiError, transportErrorMessage } from "../data/api-client";
import type { QuizQuestion } from "./types/quiz-types";

const QuizAttemptPage = () => {
    const slug = readParam("quiz");
    const questionId = slug ? null : readParam("question");

    const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!slug && !questionId) return;

        const controller = new AbortController();
        setError(null);
        setQuestions(null);

        const load = slug
            ? fetchQuizQuestions(slug, controller.signal)
            : fetchQuestion(questionId!, controller.signal).then(
                  (question) => [question],
              );

        load.then(setQuestions).catch((err: unknown) => {
            if (controller.signal.aborted) return; // unmounted / target changed
            setError(loadErrorMessage(err, !slug));
        });

        return () => controller.abort();
    }, [slug, questionId]);

    if (!slug && !questionId) return <QuizStatus message="No quiz specified." />;
    if (error) return <QuizStatus message={error} />;
    if (!questions) {
        return (
            <QuizStatus message={slug ? "Loading quiz…" : "Loading question…"} />
        );
    }
    if (questions.length === 0) {
        return <QuizStatus message="Quiz not found." />;
    }

    return <QuizSession quizId={slug} questions={questions} />;
};

const QuizStatus = ({ message }: { message: string }) => (
    <div className="main">
        <p className="quiz-status">{message}</p>
    </div>
);

function readParam(name: string): string | null {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get(name) || null;
}

function loadErrorMessage(error: unknown, single: boolean): string {
    if (error instanceof ApiError && error.kind === "notFound") {
        return single ? "Question not found." : "Quiz not found.";
    }
    return (
        transportErrorMessage(error) ??
        (single
            ? "Something went wrong loading this question."
            : "Something went wrong loading this quiz.")
    );
}

export default QuizAttemptPage;
