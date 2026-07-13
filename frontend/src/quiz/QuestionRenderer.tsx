import DragOrderField from "./fields/DragOrderField";
import MatchingField from "./fields/MatchingField";
import { BasicQuestionView } from "./BasicFormats";
import type { QuizAnswer, QuizQuestion } from "./types/quiz-types";

type QuestionRendererProps = {
    question: QuizQuestion;
    answer: QuizAnswer | undefined;
    onAnswer: (answer: QuizAnswer) => void;
    onCheck: () => void;
};

const QuestionRenderer = ({
    question,
    answer,
    onAnswer,
    onCheck,
}: QuestionRendererProps) => {
    switch (question.question_type) {
        case "drag-order": {
            const pairs = answer?.type === "drag-order" ? answer.pairs : {};

            return (
                <DragOrderField
                    mode="attempt"
                    question={question}
                    pairs={pairs}
                    onSelect={(pairs) => onAnswer({ type: "drag-order", pairs })}
                />
            );
        }

        case "matching": {
            const pairs = answer?.type === "matching" ? answer.pairs : {};

            return (
                <MatchingField
                    mode="attempt"
                    question={question}
                    pairs={pairs}
                    onSelect={(pairs) => onAnswer({ type: "matching", pairs })}
                />
            );
        }

        case "mcq-single":
        case "mcq-multi":
        case "multi-tf":
        case "fill-blank":
            return (
                <BasicQuestionView
                    question={question}
                    answer={answer}
                    onAnswer={onAnswer}
                    onCheck={onCheck}
                />
            );

        default: {
            const _exhaustive: never = question;
            return _exhaustive;
        }
    }
};

export default QuestionRenderer;
