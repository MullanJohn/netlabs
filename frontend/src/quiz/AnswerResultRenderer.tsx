import MultipleChoiceResultView from "./results/MultipleChoiceResultView";
import MultiSelectResultView from "./results/MultiSelectResultView";
import DragOrderResultView from "./results/DragOrderResultView";
import MatchingQuestionView from "./questions/MatchingQuestionView";
import MultiTfResultView from "./results/MultiTfResultView";
import FillBlankQuestionView from "./questions/FillBlankQuestionView";

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
            if (!("correctPairs" in result)) return null;

            return (
                <DragOrderResultView
                    question={question}
                    submittedAnswer={submittedAnswer}
                    result={result}
                />
            );
        }

        case "matching": {
            if (submittedAnswer.type !== "matching") return null;
            if (!("correctPairs" in result)) return null;

            return (
                <MatchingQuestionView
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
            if (!("acceptedAnswers" in result)) return null;

            return (
                <FillBlankQuestionView
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
