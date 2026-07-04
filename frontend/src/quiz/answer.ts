import type {
    QuizAnswer,
    QuizQuestion,
    SubmissionResult,
} from "./types/quiz-types";

export const slotId = (index: number) => `answer-${index}`;

export function canCheckAnswer(
    question: QuizQuestion,
    answer: QuizAnswer | undefined,
    result: SubmissionResult | undefined,
    checking: boolean,
): boolean {
    return (
        !result &&
        !checking &&
        answer !== undefined &&
        isAnswerComplete(question, answer)
    );
}

export function hasSelection(answer: QuizAnswer | undefined): boolean {
    if (!answer) return false;
    switch (answer.type) {
        case "mcq-single":
            return answer.optionId !== null;
        case "mcq-multi":
            return answer.optionIds.length > 0;
        case "drag-order":
            return Object.keys(answer.pairs).length > 0;
        case "matching":
            return Object.keys(answer.pairs).length > 0;
        case "multi-tf":
            return Object.keys(answer.verdicts).length > 0;
        case "fill-blank":
            return answer.text.trim().length > 0;
        default: {
            const _exhaustive: never = answer;
            void _exhaustive;
            return false;
        }
    }
}

export function isAnswerComplete(
    question: QuizQuestion,
    answer: QuizAnswer,
): boolean {
    switch (question.question_type) {
        case "mcq-single":
            return answer.type === "mcq-single" && answer.optionId !== null;

        case "mcq-multi":
            return (
                answer.type === "mcq-multi" &&
                answer.optionIds.length === question.select_count
            );

        case "drag-order":
            return (
                answer.type === "drag-order" &&
                Object.keys(answer.pairs).length === question.options.length
            );

        case "matching":
            return (
                answer.type === "matching" &&
                question.premises.every(
                    (premise) => answer.pairs[premise.id] !== undefined,
                )
            );

        case "multi-tf":
            return (
                answer.type === "multi-tf" &&
                question.options.every(
                    (option) => answer.verdicts[option.id] !== undefined,
                )
            );

        case "fill-blank":
            return answer.type === "fill-blank" && answer.text.trim().length > 0;

        default: {
            const _exhaustive: never = question;
            void _exhaustive;
            return false;
        }
    }
}
