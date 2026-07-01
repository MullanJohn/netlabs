import type { MultiTfQuestion } from "../types/quiz-types";
import QuestionPrompt, { stemDomId, subDomId } from "./QuestionPrompt";

export const MULTI_TF_HINT = "Mark each statement True or False.";

export const CHOICES = [
    { value: true, label: "True" },
    { value: false, label: "False" },
] as const;

type Props = {
    question: MultiTfQuestion;
    verdicts: Partial<Record<string, boolean>>;
    onSelect: (optionId: string, value: boolean) => void;
};

const MultiTfQuestionView = ({ question, verdicts, onSelect }: Props) => (
    <>
        <QuestionPrompt question={question} sub={MULTI_TF_HINT} />
        <fieldset
            className="opts"
            aria-labelledby={stemDomId(question.id)}
            aria-describedby={subDomId(question.id)}
        >
            {question.options.map((option) => {
                const value = verdicts[option.id];

                return (
                    <div className="q-tf-row" key={option.id}>
                        <span id={`stmt-${option.id}`} className="txt">
                            {option.text}
                        </span>
                        <div
                            className="q-tf-controls"
                            role="radiogroup"
                            aria-labelledby={`stmt-${option.id}`}
                        >
                            {CHOICES.map((choice) => (
                                <label
                                    key={choice.label}
                                    className={
                                        value === choice.value
                                            ? "q-opt q-tf-opt is-selected"
                                            : "q-opt q-tf-opt"
                                    }
                                >
                                    <input
                                        type="radio"
                                        className="visually-hidden"
                                        name={`${question.id}:${option.id}`}
                                        checked={value === choice.value}
                                        onChange={() =>
                                            onSelect(option.id, choice.value)
                                        }
                                    />
                                    <span
                                        className="q-tf-mark"
                                        aria-hidden="true"
                                    />
                                    <span>{choice.label}</span>
                                    <span
                                        className="q-tf-mark"
                                        aria-hidden="true"
                                    />
                                </label>
                            ))}
                        </div>
                    </div>
                );
            })}
        </fieldset>
    </>
);

export default MultiTfQuestionView;
