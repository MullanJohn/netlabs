import type { McqSingleQuestion } from "./types/quiz-types";

type Props = {
    question: McqSingleQuestion;
    selectedOptionId: string | null;
    onSelect: (optionId: string) => void;
};

const MultipleChoiceQuestionView = ({
    question,
    selectedOptionId,
    onSelect,
}: Props) => {
    return (
        <div>
            <h2>{question.stem}</h2>
            <div>
                {question.options.map((option) => (
                    <button
                        key={option.id}
                        type="button"
                        onClick={() => onSelect(option.id)}
                        className={
                            selectedOptionId === option.id
                                ? "rounded border border-blue-700 bg-blue-600 px-4 py-2 text-white"
                                : "rounded border border-gray-300 bg-white px-4 py-2 text-gray-900"
                        }
                    >
                        {option.text}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default MultipleChoiceQuestionView;
