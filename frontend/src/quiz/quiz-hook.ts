import { useState } from "react";
import { type QuizAnswers } from "./types/quiz-types";

export function useQuizAnswers() {
    const [answers, setAnswers] = useState<QuizAnswers>({});

    function selectSingleOption(questionId: string, optionId: string) {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: {
                type: "mcq-single",
                optionId,
            },
        }));
    }

    function toggleMultiSelectOption(
        questionId: string,
        optionId: string,
        selectCount: number,
    ) {
        setAnswers((prev) => {
            const currentAnswer = prev[questionId];
            const currentOptionIds =
                currentAnswer?.type === "mcq-multi"
                    ? currentAnswer.optionIds
                    : [];
            if (
                currentOptionIds.length >= selectCount &&
                !currentOptionIds.includes(optionId)
            )
                return prev;
            const nextOptionIds = currentOptionIds.includes(optionId)
                ? currentOptionIds.filter((id) => id !== optionId)
                : [...currentOptionIds, optionId];
            return {
                ...prev,
                [questionId]: {
                    type: "mcq-multi",
                    optionIds: nextOptionIds,
                },
            };
        });
    }

    function updateDragDropAnswer(
        questionId: string,
        pairs: Partial<Record<string, string>>,
    ) {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: {
                type: "drag-drop",
                pairs,
            },
        }));
    }

    return {
        answers,
        selectSingleOption,
        toggleMultiSelectOption,
        updateDragDropAnswer,
    };
}
