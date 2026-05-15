import MultipleChoiceResultView from "./results/MultipleChoiceResultView";
import MultiSelectResultView from "./results/MultiSelectResultView";
import DragDropResultView from "./results/DragDropResultView";

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

            return (
                <MultiSelectResultView
                    question={question}
                    submittedAnswer={submittedAnswer}
                    result={result}
                />
            );
        }

        case "drag-drop": {
            if (submittedAnswer.type !== "drag-drop") return null;

            return (
                <DragDropResultView
                    question={question}
                    submittedAnswer={submittedAnswer}
                    result={result}
                />
            );
        }

        default:
            return null;
    }
};

export default AnswerResultRenderer;
