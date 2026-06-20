import { useEffect, useState } from "react";
import QuizPlayer from "./QuizPlayer";
import { fetchQuizQuestions } from "../data/quiz-client";
import { ApiError } from "../data/api-client";
import type { QuizQuestion } from "./types/quiz-types";

type QuizAttemptPageProps = {
    // Optional override; otherwise the slug is read from the `quiz` query param.
    quizId?: string;
};

const QuizAttemptPage = ({ quizId }: QuizAttemptPageProps) => {
    const slug = quizId ?? readQuizSlug();

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

    if (isLoading) return <p>Loading quiz…</p>;
    if (error) return <p>{error}</p>;

    const firstQuestion = questions?.[0];
    if (!slug || !firstQuestion) return <p>Quiz not found.</p>;

    return <QuizPlayer quizId={slug} initialQuestion={firstQuestion} />;
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
