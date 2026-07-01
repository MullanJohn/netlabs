import MultipleChoiceResultView from "./results/MultipleChoiceResultView";
import MultiSelectResultView from "./results/MultiSelectResultView";
import DragOrderField from "./fields/DragOrderField";
import MatchingField from "./fields/MatchingField";
import MultiTfResultView from "./results/MultiTfResultView";
import FillBlankField from "./fields/FillBlankField";

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
        case "mcq-single": {
            if (submittedAnswer.type !== "mcq-single") return null;
            if (!("correctOptionIds" in result)) return null;

            return (
                <MultipleChoiceResultView
                    question={question}
                    submittedAnswer={submittedAnswer}
                    result={result}
                />
            );
        }

        case "mcq-multi": {
            if (submittedAnswer.type !== "mcq-multi") return null;
            if (!("correctOptionIds" in result)) return null;

            return (
                <MultiSelectResultView
                    question={question}
                    submittedAnswer={submittedAnswer}
                    result={result}
                />
            );
        }

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

        case "multi-tf": {
            if (submittedAnswer.type !== "multi-tf") return null;
            if (!("correctOptionIds" in result)) return null;

            return (
                <MultiTfResultView
                    question={question}
                    submittedAnswer={submittedAnswer}
                    result={result}
                />
            );
        }

        case "fill-blank": {
            if (submittedAnswer.type !== "fill-blank") return null;
            if (result.type !== "fill-blank") return null;

            return (
                <FillBlankField
                    mode="graded"
                    question={question}
                    text={submittedAnswer.text}
                    result={result}
                />
            );
        }

        default:
            return null;
    }
};

export default AnswerResultRenderer;
