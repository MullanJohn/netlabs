import DragOrderQuestionView from "./questions/DragOrderQuestionView";
import FillBlankQuestionView from "./questions/FillBlankQuestionView";
import MatchingQuestionView from "./questions/MatchingQuestionView";
import MultiTfQuestionView from "./questions/MultiTfQuestionView";
import MultipleChoiceQuestionView from "./questions/MultipleChoiceQuestionView";
import MultipleSelectQuestionView from "./questions/MultipleSelectQuestionView";
import type { QuizAnswer, QuizQuestion } from "./types/quiz-types";

type QuestionRendererProps = {
    question: QuizQuestion;
    answer: QuizAnswer | undefined;
    onSelectSingle: (questionId: string, optionId: string) => void;
    onToggleMulti: (
        questionId: string,
        optionId: string,
        selectCount: number,
    ) => void;
    onUpdateDragOrder: (
        questionId: string,
        pairs: Partial<Record<string, string>>,
    ) => void;
    onUpdateMatching: (
        questionId: string,
        pairs: Partial<Record<string, string>>,
    ) => void;
    onSetTrueFalse: (
        questionId: string,
        optionId: string,
        value: boolean,
    ) => void;
    onUpdateFillBlank: (questionId: string, text: string) => void;
    onCheck: () => void;
};

const QuestionRenderer = ({
    question,
    answer,
    onSelectSingle,
    onToggleMulti,
    onUpdateDragOrder,
    onUpdateMatching,
    onSetTrueFalse,
    onUpdateFillBlank,
    onCheck,
}: QuestionRendererProps) => {
    switch (question.question_type) {
        case "mcq-single": {
            const selectedOptionId =
                answer?.type === "mcq-single" ? answer.optionId : null;

            return (
                <MultipleChoiceQuestionView
                    question={question}
                    selectedOptionId={selectedOptionId}
                    onSelect={(optionId) =>
                        onSelectSingle(question.id, optionId)
                    }
                />
            );
        }

        case "mcq-multi": {
            const selectedOptionIds =
                answer?.type === "mcq-multi" ? answer.optionIds : [];

            return (
                <MultipleSelectQuestionView
                    question={question}
                    selectedOptionIds={selectedOptionIds}
                    onSelect={(optionId) =>
                        onToggleMulti(
                            question.id,
                            optionId,
                            question.select_count,
                        )
                    }
                />
            );
        }

        case "drag-order": {
            const pairs = answer?.type === "drag-order" ? answer.pairs : {};

            return (
                <DragOrderQuestionView
                    question={question}
                    pairs={pairs}
                    onSelect={(pairs) => onUpdateDragOrder(question.id, pairs)}
                />
            );
        }

        case "matching": {
            const pairs = answer?.type === "matching" ? answer.pairs : {};

            return (
                <MatchingQuestionView
                    question={question}
                    pairs={pairs}
                    onSelect={(pairs) => onUpdateMatching(question.id, pairs)}
                />
            );
        }

        case "multi-tf": {
            const verdicts =
                answer?.type === "multi-tf" ? answer.verdicts : {};

            return (
                <MultiTfQuestionView
                    question={question}
                    verdicts={verdicts}
                    onSelect={(optionId, value) =>
                        onSetTrueFalse(question.id, optionId, value)
                    }
                />
            );
        }

        case "fill-blank": {
            const text = answer?.type === "fill-blank" ? answer.text : "";

            return (
                <FillBlankQuestionView
                    question={question}
                    text={text}
                    onChange={(value) => onUpdateFillBlank(question.id, value)}
                    onSubmit={onCheck}
                />
            );
        }

        default: {
            const _exhaustive: never = question;
            return _exhaustive;
        }
    }
};

export default QuestionRenderer;
