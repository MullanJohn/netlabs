import { useEffect, useState } from "react";
import QuizSession from "./session/QuizSession";
import QuizStatus from "./QuizStatus";
import PracticeQuestionPage from "./practice/PracticeQuestionPage";
import { fetchQuizQuestions } from "../data/quiz-client";
import { loadErrorMessage } from "../data/api-client";
import type { QuizQuestion } from "./types/quiz-types";

const QuizAttemptPage = () => {
    const slug = readParam("quiz");
    const questionId = slug ? null : readParam("question");

    if (slug) return <QuizLoader slug={slug} />;
    if (questionId) return <PracticeQuestionPage questionId={questionId} />;
    return <QuizStatus message="No quiz specified." />;
};

const QuizLoader = ({ slug }: { slug: string }) => {
    const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        setError(null);
        setQuestions(null);

        fetchQuizQuestions(slug, controller.signal)
            .then(setQuestions)
            .catch((err: unknown) => {
                if (controller.signal.aborted) return; // unmounted / slug changed
                setError(
                    loadErrorMessage(
                        err,
                        "Quiz not found.",
                        "Something went wrong loading this quiz.",
                    ),
                );
            });

        return () => controller.abort();
    }, [slug]);

    if (error) return <QuizStatus message={error} />;
    if (!questions) return <QuizStatus message="Loading quiz…" />;
    if (questions.length === 0) return <QuizStatus message="Quiz not found." />;

    return <QuizSession quizId={slug} questions={questions} />;
};

function readParam(name: string): string | null {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get(name) || null;
}

export default QuizAttemptPage;
