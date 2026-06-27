import { useState } from "react";
import { useQuizState } from "../quiz-hook";
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
    selectedCount: number;
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
    }

    return {
        questions,
        total,
        currentIndex,
        currentQuestion,
        answers,
        results,
        selectedCount,
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

function hasSelection(answer: QuizAnswer | undefined): boolean {
    if (!answer) return false;
    switch (answer.type) {
        case "mcq-single":
            return answer.optionId !== null;
        case "mcq-multi":
            return answer.optionIds.length > 0;
        case "drag-order":
            return Object.keys(answer.pairs).length > 0;
        default: {
            const _exhaustive: never = answer;
            void _exhaustive;
            return false;
        }
    }
}
