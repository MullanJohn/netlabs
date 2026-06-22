import type { McqMultiQuestion } from "../types/quiz-types";
import QuestionPrompt, { stemDomId, subDomId } from "./QuestionPrompt";

type Props = {
    question: McqMultiQuestion;
    selectedOptionIds: string[];
    onSelect: (optionId: string) => void;
};

const MultipleSelectQuestionView = ({
    question,
    selectedOptionIds,
    onSelect,
}: Props) => (
    <>
        <QuestionPrompt
            question={question}
            sub={
                <>
                    <b>Select all that apply.</b> Choose {question.select_count}.
                </>
            }
        />
        <fieldset
            className="opts"
            aria-labelledby={stemDomId(question.id)}
            aria-describedby={subDomId(question.id)}
        >
            {question.options.map((option, index) => {
                const isSelected = selectedOptionIds.includes(option.id);

                return (
                    <label
                        key={option.id}
                        className={isSelected ? "q-opt is-selected" : "q-opt"}
                    >
                        <input
                            type="checkbox"
                            className="visually-hidden"
                            name={question.id}
                            value={option.id}
                            checked={isSelected}
                            onChange={() => onSelect(option.id)}
                        />
                        <span className="k">
                            {String.fromCharCode(65 + index)}
                        </span>
                        <span className="txt">{option.text}</span>
                    </label>
                );
            })}
        </fieldset>
    </>
);

export default MultipleSelectQuestionView;
