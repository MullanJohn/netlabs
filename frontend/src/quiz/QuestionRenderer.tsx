import DragOrderField from "./fields/DragOrderField";
import FillBlankField from "./fields/FillBlankField";
import MatchingField from "./fields/MatchingField";
import MultiTfQuestionView from "./questions/MultiTfQuestionView";
import MultipleChoiceQuestionView from "./questions/MultipleChoiceQuestionView";
import MultipleSelectQuestionView from "./questions/MultipleSelectQuestionView";
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
        case "mcq-single": {
            const selectedOptionId =
                answer?.type === "mcq-single" ? answer.optionId : null;

            return (
                <MultipleChoiceQuestionView
                    question={question}
                    selectedOptionId={selectedOptionId}
                    onSelect={(optionId) =>
                        onAnswer({ type: "mcq-single", optionId })
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
                    onSelect={(optionId) => {
                        const isSelected = selectedOptionIds.includes(optionId);
                        if (
                            !isSelected &&
                            selectedOptionIds.length >= question.select_count
                        ) {
                            return;
                        }
                        onAnswer({
                            type: "mcq-multi",
                            optionIds: isSelected
                                ? selectedOptionIds.filter(
                                      (id) => id !== optionId,
                                  )
                                : [...selectedOptionIds, optionId],
                        });
                    }}
                />
            );
        }

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

        case "multi-tf": {
            const verdicts =
                answer?.type === "multi-tf" ? answer.verdicts : {};

            return (
                <MultiTfQuestionView
                    question={question}
                    verdicts={verdicts}
                    onSelect={(optionId, value) =>
                        onAnswer({
                            type: "multi-tf",
                            verdicts: { ...verdicts, [optionId]: value },
                        })
                    }
                />
            );
        }

        case "fill-blank": {
            const text = answer?.type === "fill-blank" ? answer.text : "";

            return (
                <FillBlankField
                    mode="attempt"
                    question={question}
                    text={text}
                    onChange={(value) =>
                        onAnswer({ type: "fill-blank", text: value })
                    }
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
