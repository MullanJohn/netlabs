import type {
    QuizAnswer,
    QuizQuestion,
    SubmissionResult,
} from "./types/quiz-types";

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
        validateAnswer(question, answer) === null
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

export function validateAnswer(
    question: QuizQuestion,
    answer: QuizAnswer,
): string | null {
    switch (question.question_type) {
        case "mcq-single": {
            if (!answer || answer.type !== "mcq-single") {
                return "Please select one option.";
            }

            return null;
        }

        case "mcq-multi": {
            if (!answer || answer.type !== "mcq-multi") {
                return `Please select ${question.select_count} option(s).`;
            }

            if (answer.optionIds.length !== question.select_count) {
                return `Please select exactly ${question.select_count} option(s).`;
            }

            return null;
        }

        case "drag-order": {
            if (!answer || answer.type !== "drag-order") {
                return "Please complete the matching question.";
            }

            const selectedPairCount = Object.keys(answer.pairs).length;
            const requiredPairCount = question.options.length;

            if (selectedPairCount !== requiredPairCount) {
                return "Please match all items before submitting.";
            }

            return null;
        }

        case "matching": {
            if (!answer || answer.type !== "matching") {
                return "Please match every item.";
            }

            const allMatched = question.premises.every(
                (premise) => answer.pairs[premise.id],
            );

            return allMatched ? null : "Please match every item.";
        }

        case "multi-tf": {
            if (!answer || answer.type !== "multi-tf") {
                return "Please mark every statement True or False.";
            }

            const allJudged = question.options.every(
                (option) => answer.verdicts[option.id] !== undefined,
            );

            return allJudged
                ? null
                : "Please mark every statement True or False.";
        }

        case "fill-blank": {
            if (!answer || answer.type !== "fill-blank") {
                return "Please type an answer.";
            }

            return answer.text.trim().length > 0
                ? null
                : "Please type an answer.";
        }

        default:
            return "Unsupported question type.";
    }
}
