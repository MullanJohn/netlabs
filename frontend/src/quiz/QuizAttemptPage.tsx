import { useEffect, useState } from "react";
import QuizSession from "./session/QuizSession";
import { fetchQuizQuestions } from "../data/quiz-client";
import { ApiError, transportErrorMessage } from "../data/api-client";
import type { QuizQuestion } from "./types/quiz-types";

const QuizAttemptPage = () => {
    const slug = readQuizSlug();

    const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) return;

        const controller = new AbortController();
        setError(null);
        setQuestions(null);

        fetchQuizQuestions(slug, controller.signal)
            .then(setQuestions)
            .catch((err: unknown) => {
                if (controller.signal.aborted) return; // unmounted / slug changed
                setError(loadErrorMessage(err));
            });

        return () => controller.abort();
    }, [slug]);

    if (!slug) return <QuizStatus message="No quiz specified." />;
    if (error) return <QuizStatus message={error} />;
    if (!questions) return <QuizStatus message="Loading quiz…" />;
    if (questions.length === 0) return <QuizStatus message="Quiz not found." />;

    return <QuizSession quizId={slug} questions={questions} />;
};

const QuizStatus = ({ message }: { message: string }) => (
    <div className="main">
        <p className="quiz-status">{message}</p>
    </div>
);

function readQuizSlug(): string | null {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("quiz");
}

function loadErrorMessage(error: unknown): string {
    if (error instanceof ApiError && error.kind === "notFound") {
        return "Quiz not found.";
    }
    return (
        transportErrorMessage(error) ?? "Something went wrong loading this quiz."
    );
}

export default QuizAttemptPage;
