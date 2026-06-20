import { useEffect, useState } from "react";
import QuizPlayer from "./QuizPlayer";
import { fetchQuizQuestions } from "../data/quiz-client";
import { ApiError } from "../data/api-client";
import type { QuizQuestion } from "./types/quiz-types";

type QuizAttemptPageProps = {
    quizId: string;
};

const QuizAttemptPage = ({ quizId }: QuizAttemptPageProps) => {
    const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        setIsLoading(true);
        setError(null);
        setQuestions(null);

        fetchQuizQuestions(quizId, controller.signal)
            .then((loaded) => {
                setQuestions(loaded);
                setIsLoading(false);
            })
            .catch((err: unknown) => {
                if (controller.signal.aborted) return; // unmounted / quizId changed
                setError(loadErrorMessage(err));
                setIsLoading(false);
            });

        return () => controller.abort();
    }, [quizId]);

    if (isLoading) return <p>Loading quiz…</p>;
    if (error) return <p>{error}</p>;

    // Bridge: the player still runs one question at a time. Full-set navigation
    // (client owns the list) lands in the attempt-shell step.
    const firstQuestion = questions?.[0];
    if (!firstQuestion) return <p>Quiz not found.</p>;

    return <QuizPlayer quizId={quizId} initialQuestion={firstQuestion} />;
};

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
