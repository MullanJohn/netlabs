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

    function updateDragOrderAnswer(
        questionId: string,
        pairs: Partial<Record<string, string>>,
    ) {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: {
                type: "drag-order",
                pairs,
            },
        }));
    }

    function clearAnswer(questionId: string) {
        setAnswers((prev) => {
            if (!(questionId in prev)) return prev;
            const next = { ...prev };
            delete next[questionId];
            return next;
        });
    }

    return {
        answers,
        selectSingleOption,
        toggleMultiSelectOption,
        updateDragOrderAnswer,
        clearAnswer,
    };
}
