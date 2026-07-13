import FillBlankField from "./fields/FillBlankField";
import MultiTfQuestionView from "./questions/MultiTfQuestionView";
import MultipleChoiceQuestionView from "./questions/MultipleChoiceQuestionView";
import MultipleSelectQuestionView from "./questions/MultipleSelectQuestionView";
import MultiSelectResultView from "./results/MultiSelectResultView";
import MultiTfResultView from "./results/MultiTfResultView";
import MultipleChoiceResultView from "./results/MultipleChoiceResultView";
import type {
    QuizAnswer,
    QuizQuestion,
    SubmissionResult,
} from "./types/quiz-types";

// Dependency-light formats only: shared by the full quiz surfaces and the
// homepage sample island, which must never pull DragOrderField's @dnd-kit.

type QuestionProps = {
    question: QuizQuestion;
    answer: QuizAnswer | undefined;
    onAnswer: (answer: QuizAnswer) => void;
    onCheck: () => void;
};

export const BasicQuestionView = ({
    question,
    answer,
    onAnswer,
    onCheck,
}: QuestionProps) => {
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

        case "drag-order":
        case "matching":
            return null;

        default: {
            const _exhaustive: never = question;
            return _exhaustive;
        }
    }
};

type ResultProps = {
    question: QuizQuestion;
    answer: QuizAnswer;
    result: SubmissionResult;
};

export const BasicResultView = ({ question, answer, result }: ResultProps) => {
    switch (question.question_type) {
        case "mcq-single": {
            if (answer.type !== "mcq-single") return null;
            if (result.type !== "mcq-single") return null;

            return (
                <MultipleChoiceResultView
                    question={question}
                    submittedAnswer={answer}
                    result={result}
                />
            );
        }

        case "mcq-multi": {
            if (answer.type !== "mcq-multi") return null;
            if (result.type !== "mcq-multi") return null;

            return (
                <MultiSelectResultView
                    question={question}
                    submittedAnswer={answer}
                    result={result}
                />
            );
        }

        case "multi-tf": {
            if (answer.type !== "multi-tf") return null;
            if (result.type !== "multi-tf") return null;

            return (
                <MultiTfResultView
                    question={question}
                    submittedAnswer={answer}
                    result={result}
                />
            );
        }

        case "fill-blank": {
            if (answer.type !== "fill-blank") return null;
            if (result.type !== "fill-blank") return null;

            return (
                <FillBlankField
                    mode="graded"
                    question={question}
                    text={answer.text}
                    result={result}
                />
            );
        }

        case "drag-order":
        case "matching":
            return null;

        default: {
            const _exhaustive: never = question;
            return _exhaustive;
        }
    }
};
