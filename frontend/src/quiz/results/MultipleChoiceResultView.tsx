import type {
    McqSingleQuestion,
    QuizAnswer,
    QuizQuestion,
    SubmissionResult,
} from "./types/quiz-types";

type MultipleChoiceResultViewProps = {
    question: McqSingleQuestion;
    submittedAnswer: Extract<QuizAnswer, { type: "mcq-single" }>;
    result: SubmissionResult;
};

const MultipleChoiceResultView = ({
    question,
    submittedAnswer,
    result,
}: MultipleChoiceResultViewProps) => {
    return (
        <div>
            <h2>{question.stem}</h2>

            <p>{result.isCorrect ? "Correct" : "Incorrect"}</p>

            <div className="space-y-2">
                {question.options.map((option) => {
                    const isSelected = option.id === submittedAnswer.optionId;
                    const isCorrect =
                        result.correctOptionIds?.includes(option.id) ?? false;

                    return (
                        <div
                            key={option.id}
                            className={
                                isCorrect
                                    ? "rounded border border-green-500 p-2"
                                    : isSelected
                                      ? "rounded border border-red-500 p-2"
                                      : "rounded border border-gray-300 p-2"
                            }
                        >
                            {option.text}
                        </div>
                    );
                })}
            </div>

            {result.explanation && <p>{result.explanation}</p>}
        </div>
    );
};

export default MultipleChoiceResultView;
