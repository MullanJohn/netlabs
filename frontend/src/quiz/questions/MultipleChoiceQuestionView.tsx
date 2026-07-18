import type { McqSingleQuestion } from "../types/quiz-types";
import QuestionPrompt, { optionLetter, stemDomId } from "./QuestionPrompt";

type Props = {
    question: McqSingleQuestion;
    selectedOptionId: string | null;
    onSelect: (optionId: string) => void;
};

const MultipleChoiceQuestionView = ({
    question,
    selectedOptionId,
    onSelect,
}: Props) => (
    <>
        <QuestionPrompt question={question} />
        <fieldset className="opts" aria-labelledby={stemDomId(question.id)}>
            {question.options.map((option, index) => {
                const isSelected = selectedOptionId === option.id;

                return (
                    <label
                        key={option.id}
                        className={isSelected ? "q-opt is-selected" : "q-opt"}
                    >
                        <input
                            type="radio"
                            className="visually-hidden"
                            name={question.id}
                            value={option.id}
                            checked={isSelected}
                            onChange={() => onSelect(option.id)}
                        />
                        <span className="k">{optionLetter(index)}</span>
                        <span className="txt">{option.text}</span>
                        <span className="verdict-mark" aria-hidden="true" />
                    </label>
                );
            })}
        </fieldset>
    </>
);

export default MultipleChoiceQuestionView;
