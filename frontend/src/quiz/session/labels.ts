import type { QuizQuestion } from "../types/quiz-types";

type QuestionType = QuizQuestion["question_type"];

export function drillLabel(slug: string): string {
    return slug.replace(/-/g, " ");
}

export function questionTypeLabel(type: QuestionType): string {
    switch (type) {
        case "mcq-single":
            return "single-choice";
        case "mcq-multi":
            return "multi-select";
        case "drag-order":
            return "drag-order";
        default: {
            const _exhaustive: never = type;
            return _exhaustive;
        }
    }
}

export function questionTypeShort(type: QuestionType): string {
    switch (type) {
        case "mcq-single":
            return "choice";
        case "mcq-multi":
            return "multi";
        case "drag-order":
            return "order";
        default: {
            const _exhaustive: never = type;
            return _exhaustive;
        }
    }
}
