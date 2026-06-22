import { useState } from "react";
import { useQuizAnswers } from "../quiz-hook";
import type {
    QuizAnswer,
    QuizAnswers,
    QuizQuestion,
} from "../types/quiz-types";

export type QuizSessionApi = {
    questions: QuizQuestion[];
    total: number;
    currentIndex: number;
    currentQuestion: QuizQuestion | undefined;
    answers: QuizAnswers;
    answeredCount: number;
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
};

export function useQuizSession(questions: QuizQuestion[]): QuizSessionApi {
    const {
        answers,
        selectSingleOption,
        toggleMultiSelectOption,
        updateDragOrderAnswer,
        clearAnswer,
    } = useQuizAnswers();
    const [currentIndex, setCurrentIndex] = useState(0);

    const total = questions.length;
    const currentQuestion = questions[currentIndex];
    const answeredCount = questions.filter((question) =>
        hasSelection(answers[question.id]),
    ).length;

    function goTo(index: number) {
        if (index < 0 || index >= total) return;
        setCurrentIndex(index);
    }

    return {
        questions,
        total,
        currentIndex,
        currentQuestion,
        answers,
        answeredCount,
        goTo,
        selectSingleOption,
        toggleMultiSelectOption,
        updateDragOrderAnswer,
        clearAnswer,
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
