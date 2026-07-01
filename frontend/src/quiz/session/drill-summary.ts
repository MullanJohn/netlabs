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

export function resultStatus(
    result: SubmissionResult | undefined,
): DrillItemStatus {
    if (!result) return "unchecked";
    return result.isCorrect ? "correct" : "incorrect";
}

export function buildDrillSummary(
    questions: QuizQuestion[],
    results: Record<string, SubmissionResult>,
): DrillSummary {
    const items: DrillItem[] = questions.map((question, index) => ({
        question,
        index,
        status: resultStatus(results[question.id]),
    }));

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
