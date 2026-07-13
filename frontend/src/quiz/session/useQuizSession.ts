import { useCallback, useMemo, useState } from "react";
import { useQuizState } from "../useQuizState";
import { hasSelection } from "../answer";
import type {
    QuizAnswer,
    QuizAnswers,
    QuizQuestion,
    SubmissionResult,
} from "../types/quiz-types";

export type QuizSessionApi = {
    questions: QuizQuestion[];
    total: number;
    currentIndex: number;
    currentQuestion: QuizQuestion | undefined;
    answers: QuizAnswers;
    results: Record<string, SubmissionResult>;
    errors: Record<string, string | undefined>;
    checkingId: string | null;
    selectedCount: number;
    answeredKey: string;
    resetKey: number;
    goTo: (index: number) => void;
    setAnswer: (questionId: string, answer: QuizAnswer) => void;
    checkAnswer: (question: QuizQuestion) => void;
    resetQuiz: () => void;
};

export function useQuizSession(
    quizId: string,
    questions: QuizQuestion[],
): QuizSessionApi {
    const { answers, results, checkingId, errors, setAnswer, checkAnswer, reset } =
        useQuizState(quizId);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [resetKey, setResetKey] = useState(0);

    const total = questions.length;
    const currentQuestion = questions[currentIndex];

    const { selectedCount, answeredKey } = useMemo(() => {
        const flags = questions.map((question) =>
            hasSelection(answers[question.id]),
        );
        return {
            selectedCount: flags.filter(Boolean).length,
            answeredKey: flags.map((flag) => (flag ? "1" : "0")).join(""),
        };
    }, [questions, answers]);

    const goTo = useCallback(
        (index: number) => {
            if (index < 0 || index >= total) return;
            setCurrentIndex(index);
        },
        [total],
    );

    const resetQuiz = useCallback(() => {
        reset();
        setCurrentIndex(0);
        setResetKey((key) => key + 1);
    }, [reset]);

    return {
        questions,
        total,
        currentIndex,
        currentQuestion,
        answers,
        results,
        errors,
        checkingId,
        selectedCount,
        answeredKey,
        resetKey,
        goTo,
        setAnswer,
        checkAnswer,
        resetQuiz,
    };
}
