import DragDropQuestionView from "./questions/DragDropQuestionView";
import MultipleChoiceQuestionView from "./questions/MultipleChoiceQuestionView";
import MultipleSelectQuestionView from "./questions/MultiSelectQuestionView";
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
    onUpdateDragDrop: (
        questionId: string,
        pairs: Partial<Record<string, string>>,
    ) => void;
};

const QuestionRenderer = ({
    question,
    answer,
    onSelectSingle,
    onToggleMulti,
    onUpdateDragDrop,
}: QuestionRendererProps) => {
    switch (question.question_type) {
        case "mcq-single": {
            const selectedOptionId =
                answer?.type === "mcq-single" ? answer.optionId : undefined;

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

        case "drag-drop": {
            const pairs = answer?.type === "drag-drop" ? answer.pairs : {};

            return (
                <DragDropQuestionView
                    question={question}
                    pairs={pairs}
                    onSelect={(pairs) => onUpdateDragDrop(question.id, pairs)}
                />
            );
        }

        default:
            return null;
    }
};

export default QuestionRenderer;
