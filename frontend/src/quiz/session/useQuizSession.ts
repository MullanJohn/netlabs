import { useState } from "react";
import { useQuizState } from "../quiz-hook";
import { hasSelection } from "../answer";
import type {
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
    selectedCount: number;
    resetKey: number;
    isChecking: (questionId: string) => boolean;
    errorFor: (questionId: string) => string | undefined;
    goTo: (index: number) => void;
    selectSingleOption: (questionId: string, optionId: string) => void;
    toggleMultiSelectOption: (
        questionId: string,
        optionId: string,
        selectCount: number,
    ) => void;
    updateDragOrderAnswer: (
        questionId: string,
        pairs: Partial<Record<string, string>>,
    ) => void;
    clearAnswer: (questionId: string) => void;
    checkAnswer: (question: QuizQuestion) => void;
    resetQuiz: () => void;
};

export function useQuizSession(
    quizId: string,
    questions: QuizQuestion[],
): QuizSessionApi {
    const {
        answers,
        results,
        checkingId,
        errors,
        selectSingleOption,
        toggleMultiSelectOption,
        updateDragOrderAnswer,
        clearAnswer,
        checkAnswer,
        reset,
    } = useQuizState(quizId);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [resetKey, setResetKey] = useState(0);

    const total = questions.length;
    const currentQuestion = questions[currentIndex];
    const selectedCount = questions.filter((question) =>
        hasSelection(answers[question.id]),
    ).length;

    function goTo(index: number) {
        if (index < 0 || index >= total) return;
        setCurrentIndex(index);
    }

    function resetQuiz() {
        reset();
        setCurrentIndex(0);
        setResetKey((key) => key + 1);
    }

    return {
        questions,
        total,
        currentIndex,
        currentQuestion,
        answers,
        results,
        selectedCount,
        resetKey,
        isChecking: (questionId) => checkingId === questionId,
        errorFor: (questionId) => errors[questionId],
        goTo,
        selectSingleOption,
        toggleMultiSelectOption,
        updateDragOrderAnswer,
        clearAnswer,
        checkAnswer,
        resetQuiz,
    };
}
