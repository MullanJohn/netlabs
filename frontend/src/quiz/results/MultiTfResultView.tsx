import type {
    MultiTfQuestion,
    MultiTfResult,
    QuizAnswer,
} from "../types/quiz-types";
import QuestionPrompt from "../questions/QuestionPrompt";
import { MULTI_TF_HINT, CHOICES } from "../questions/MultiTfQuestionView";
import Verdict from "./Verdict";

type Props = {
    question: MultiTfQuestion;
    submittedAnswer: Extract<QuizAnswer, { type: "multi-tf" }>;
    result: MultiTfResult;
};

const MultiTfResultView = ({ question, submittedAnswer, result }: Props) => (
    <>
        <QuestionPrompt question={question} sub={MULTI_TF_HINT} />
        <div className="opts">
            {question.options.map((option) => {
                const correctValue = result.correctOptionIds.includes(option.id);
                const yourValue = submittedAnswer.verdicts[option.id];

                return (
                    <div className="q-tf-row" key={option.id}>
                        <span className="txt">{option.text}</span>
                        <div className="q-tf-controls">
                            {CHOICES.map((choice) => {
                                const isCorrect = correctValue === choice.value;
                                const isWrong =
                                    yourValue === choice.value &&
                                    yourValue !== correctValue;
                                const state = isCorrect
                                    ? "is-correct"
                                    : isWrong
                                      ? "is-wrong"
                                      : "is-muted";

                                return (
                                    <div
                                        key={choice.label}
                                        className={`q-opt q-tf-opt ${state}`}
                                    >
                                        <span
                                            className="q-tf-mark"
                                            aria-hidden="true"
                                        />
                                        <span>{choice.label}</span>
                                        <span
                                            className="q-tf-mark"
                                            aria-hidden="true"
                                        >
                                            {isCorrect
                                                ? "✓"
                                                : isWrong
                                                  ? "✗"
                                                  : ""}
                                        </span>
                                        {isCorrect && (
                                            <span className="visually-hidden">
                                                correct answer
                                            </span>
                                        )}
                                        {isWrong && (
                                            <span className="visually-hidden">
                                                your answer, incorrect
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
        <Verdict isCorrect={result.isCorrect} explanation={result.explanation} />
    </>
);

export default MultiTfResultView;
