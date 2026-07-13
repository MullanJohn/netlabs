import DragOrderField from "./fields/DragOrderField";
import MatchingField from "./fields/MatchingField";
import { BasicResultView } from "./BasicFormats";

import type {
    QuizAnswer,
    QuizQuestion,
    SubmissionResult,
} from "./types/quiz-types";

type AnswerResultRendererProps = {
    question: QuizQuestion;
    submittedAnswer: QuizAnswer;
    result: SubmissionResult;
};

const AnswerResultRenderer = ({
    question,
    submittedAnswer,
    result,
}: AnswerResultRendererProps) => {
    switch (question.question_type) {
        case "drag-order": {
            if (submittedAnswer.type !== "drag-order") return null;
            if (result.type !== "drag-order") return null;

            return (
                <DragOrderField
                    mode="graded"
                    question={question}
                    pairs={submittedAnswer.pairs}
                    result={result}
                />
            );
        }

        case "matching": {
            if (submittedAnswer.type !== "matching") return null;
            if (result.type !== "matching") return null;

            return (
                <MatchingField
                    mode="graded"
                    question={question}
                    pairs={submittedAnswer.pairs}
                    result={result}
                />
            );
        }

        case "mcq-single":
        case "mcq-multi":
        case "multi-tf":
        case "fill-blank":
            return (
                <BasicResultView
                    question={question}
                    answer={submittedAnswer}
                    result={result}
                />
            );

        default: {
            const _exhaustive: never = question;
            return _exhaustive;
        }
    }
};

export default AnswerResultRenderer;
