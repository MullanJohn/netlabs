import FillBlankField from "../fields/FillBlankField";
import MultiTfQuestionView from "../questions/MultiTfQuestionView";
import MultipleChoiceQuestionView from "../questions/MultipleChoiceQuestionView";
import MultipleSelectQuestionView from "../questions/MultipleSelectQuestionView";
import MultiSelectResultView from "../results/MultiSelectResultView";
import MultiTfResultView from "../results/MultiTfResultView";
import MultipleChoiceResultView from "../results/MultipleChoiceResultView";
import type {
    QuizAnswer,
    QuizQuestion,
    SubmissionResult,
} from "../types/quiz-types";

type Props = {
    question: QuizQuestion;
    answer: QuizAnswer | undefined;
    result: SubmissionResult | undefined;
    onAnswer: (answer: QuizAnswer) => void;
    onCheck: () => void;
};

// Sample-scoped renderer: only the MCQ-family formats, so the homepage
// island never pulls DragOrderField's @dnd-kit dependency.
const SampleQuestion = ({
    question,
    answer,
    result,
    onAnswer,
    onCheck,
}: Props) => {
    switch (question.question_type) {
        case "mcq-single": {
            if (result?.type === "mcq-single" && answer?.type === "mcq-single") {
                return (
                    <MultipleChoiceResultView
                        question={question}
                        submittedAnswer={answer}
                        result={result}
                    />
                );
            }
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
            if (result?.type === "mcq-multi" && answer?.type === "mcq-multi") {
                return (
                    <MultiSelectResultView
                        question={question}
                        submittedAnswer={answer}
                        result={result}
                    />
                );
            }
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

        case "multi-tf": {
            if (result?.type === "multi-tf" && answer?.type === "multi-tf") {
                return (
                    <MultiTfResultView
                        question={question}
                        submittedAnswer={answer}
                        result={result}
                    />
                );
            }
            const verdicts = answer?.type === "multi-tf" ? answer.verdicts : {};

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
            if (result?.type === "fill-blank" && answer?.type === "fill-blank") {
                return (
                    <FillBlankField
                        mode="graded"
                        question={question}
                        text={answer.text}
                        result={result}
                    />
                );
            }
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

        default:
            return null;
    }
};

export default SampleQuestion;
