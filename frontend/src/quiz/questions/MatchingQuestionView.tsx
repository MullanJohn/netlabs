import type { MatchingQuestion, SubmissionResult } from "../types/quiz-types";
import QuestionPrompt, { stemDomId, subDomId } from "./QuestionPrompt";
import Verdict from "../results/Verdict";

export const MATCH_HINT = "Choose the best match for each item.";

const optionLetter = (index: number) => String.fromCharCode(65 + index);

type GradedResult = Extract<SubmissionResult, { type: "drag-order" | "matching" }>;

type Props = {
    question: MatchingQuestion;
    pairs: Partial<Record<string, string>>;
    onSelect?: (pairs: Partial<Record<string, string>>) => void;
    result?: GradedResult;
};

const MatchingQuestionView = ({ question, pairs, onSelect, result }: Props) => {
    const labelFor = (id: string | undefined) => {
        const index = question.options.findIndex((option) => option.id === id);
        if (index === -1) return "—";
        return `${optionLetter(index)}. ${question.options[index].text}`;
    };

    return (
        <>
            <QuestionPrompt question={question} sub={MATCH_HINT} />
            <dl className="q-match-legend">
                <dt>Options</dt>
                {question.options.map((option, index) => (
                    <dd key={option.id}>
                        <span className="k">{optionLetter(index)}</span>
                        <span>{option.text}</span>
                    </dd>
                ))}
            </dl>
            <div
                className="q-match"
                role="group"
                aria-labelledby={stemDomId(question.id)}
                aria-describedby={subDomId(question.id)}
            >
                {question.premises.map((premise) => {
                    const picked = pairs[premise.id] ?? "";
                    const correct = result
                        ? result.correctPairs[premise.id]
                        : undefined;
                    const isCorrect =
                        correct !== undefined && picked === correct;
                    const rowClass = !result
                        ? "q-match-row"
                        : isCorrect
                          ? "q-match-row is-correct"
                          : "q-match-row is-wrong";

                    return (
                        <div className={rowClass} key={premise.id}>
                            <span className="premise">{premise.text}</span>
                            <select
                                className="q-match-value"
                                value={picked}
                                data-empty={picked ? undefined : "true"}
                                aria-label={`Match for: ${premise.text}`}
                                aria-disabled={result ? true : undefined}
                                tabIndex={result ? -1 : undefined}
                                onChange={(event) => {
                                    if (result) return;
                                    onSelect?.({
                                        ...pairs,
                                        [premise.id]: event.target.value,
                                    });
                                }}
                            >
                                <option value="" disabled hidden>
                                    — select —
                                </option>
                                {question.options.map((option, index) => (
                                    <option key={option.id} value={option.id}>
                                        {optionLetter(index)}. {option.text}
                                    </option>
                                ))}
                            </select>
                            <span className="q-match-mark" aria-hidden="true">
                                {result ? (isCorrect ? "✓" : "✗") : ""}
                            </span>
                            <span className="q-match-correct">
                                {result && !isCorrect
                                    ? `correct: ${labelFor(correct)}`
                                    : ""}
                            </span>
                            {result && (
                                <span className="visually-hidden">
                                    {isCorrect ? "correct" : "incorrect"}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
            {result && (
                <Verdict
                    isCorrect={result.isCorrect}
                    explanation={result.explanation}
                />
            )}
        </>
    );
};

export default MatchingQuestionView;
