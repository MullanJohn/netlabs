import type { QuizQuestion, SubmissionResult } from "../types/quiz-types";

export type DrillItemStatus = "correct" | "incorrect" | "unchecked";

export type DrillItem = {
    question: QuizQuestion;
    index: number;
    status: DrillItemStatus;
};

export type DrillSummary = {
    total: number;
    correct: number;
    incorrect: number;
    allChecked: boolean;
    items: DrillItem[];
    unchecked: DrillItem[];
};

export function buildDrillSummary(
    questions: QuizQuestion[],
    results: Record<string, SubmissionResult>,
): DrillSummary {
    const items: DrillItem[] = questions.map((question, index) => {
        const result = results[question.id];
        const status: DrillItemStatus = !result
            ? "unchecked"
            : result.isCorrect
              ? "correct"
              : "incorrect";
        return { question, index, status };
    });

    const correct = items.filter((item) => item.status === "correct").length;
    const incorrect = items.filter(
        (item) => item.status === "incorrect",
    ).length;
    const unchecked = items.filter((item) => item.status === "unchecked");
    const total = questions.length;

    return {
        total,
        correct,
        incorrect,
        allChecked: total > 0 && unchecked.length === 0,
        items,
        unchecked,
    };
}
