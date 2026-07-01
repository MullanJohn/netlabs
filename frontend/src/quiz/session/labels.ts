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
        case "matching":
            return "matching";
        case "multi-tf":
            return "true / false";
        case "fill-blank":
            return "fill in the blank";
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
        case "matching":
            return "match";
        case "multi-tf":
            return "t/f";
        case "fill-blank":
            return "fill";
        default: {
            const _exhaustive: never = type;
            return _exhaustive;
        }
    }
}
