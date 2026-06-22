import { useEffect, useState } from "react";
import QuizSession from "./session/QuizSession";
import { fetchQuizQuestions } from "../data/quiz-client";
import { ApiError } from "../data/api-client";
import type { QuizQuestion } from "./types/quiz-types";

const QuizAttemptPage = () => {
    const slug = readQuizSlug();

    const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) {
            setError("No quiz specified.");
            setIsLoading(false);
            return;
        }

        const controller = new AbortController();
        setIsLoading(true);
        setError(null);
        setQuestions(null);

        fetchQuizQuestions(slug, controller.signal)
            .then((loaded) => {
                setQuestions(loaded);
                setIsLoading(false);
            })
            .catch((err: unknown) => {
                if (controller.signal.aborted) return; // unmounted / slug changed
                setError(loadErrorMessage(err));
                setIsLoading(false);
            });

        return () => controller.abort();
    }, [slug]);

    if (isLoading) {
        return (
            <div className="main">
                <p className="quiz-status">Loading quiz…</p>
            </div>
        );
    }
    if (error) {
        return (
            <div className="main">
                <p className="quiz-status">{error}</p>
            </div>
        );
    }
    if (!slug || !questions || questions.length === 0) {
        return (
            <div className="main">
                <p className="quiz-status">Quiz not found.</p>
            </div>
        );
    }

    return <QuizSession quizId={slug} questions={questions} />;
};

function readQuizSlug(): string | null {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("quiz");
}

function loadErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        switch (error.kind) {
            case "notFound":
                return "Quiz not found.";
            case "network":
                return "Couldn't reach the server. Please try again.";
            case "server":
                return "The server had a problem. Please try again.";
            case "client":
                return "Something went wrong loading this quiz.";
        }
    }
    return "Something went wrong loading this quiz.";
}

export default QuizAttemptPage;
