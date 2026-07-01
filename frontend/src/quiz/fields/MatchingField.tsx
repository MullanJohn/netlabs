import type { MatchingQuestion, SubmissionResult } from "../types/quiz-types";
import QuestionPrompt, { stemDomId, subDomId } from "../questions/QuestionPrompt";
import Verdict from "../results/Verdict";

export const MATCH_HINT = "Choose the best match for each item.";

const optionLetter = (index: number) => String.fromCharCode(65 + index);

type Pairs = Partial<Record<string, string>>;
type GradedResult = Extract<SubmissionResult, { type: "matching" }>;

type Base = { question: MatchingQuestion; pairs: Pairs };
type Props =
    | (Base & { mode: "attempt"; onSelect: (pairs: Pairs) => void })
    | (Base & { mode: "graded"; result: GradedResult });

const MatchingField = (props: Props) => {
    const { question, pairs } = props;
    const result = props.mode === "graded" ? props.result : null;

    const labelFor = (id: string | undefined) => {
        const index = question.options.findIndex((option) => option.id === id);
        if (index === -1) return "—";
        return `${optionLetter(index)}. ${question.options[index].text}`;
    };

    const corrections =
        result === null
            ? []
            : question.premises
                  .map((premise) => ({
                      premise,
                      picked: pairs[premise.id],
                      correct: result.correctPairs[premise.id],
                  }))
                  .filter(
                      ({ picked, correct }) =>
                          correct !== undefined && picked !== correct,
                  );

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
                    const premiseId = `premise-${premise.id}`;

                    return (
                        <div className={rowClass} key={premise.id}>
                            <span id={premiseId} className="premise">
                                {premise.text}
                            </span>
                            <select
                                className="q-match-value"
                                value={picked}
                                data-empty={picked ? undefined : "true"}
                                aria-labelledby={premiseId}
                                aria-disabled={result ? true : undefined}
                                tabIndex={result ? -1 : undefined}
                                onChange={(event) => {
                                    if (props.mode !== "attempt") return;
                                    props.onSelect({
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
                            {result && (
                                <span className="visually-hidden">
                                    {isCorrect ? "correct" : "incorrect"}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
            {corrections.length > 0 && (
                <div className="q-corrections">
                    <h4>Corrections</h4>
                    <ul>
                        {corrections.map(({ premise, picked, correct }) => (
                            <li key={premise.id}>
                                {premise.text}: you chose{" "}
                                <span className="you">{labelFor(picked)}</span>,
                                correct answer is{" "}
                                <span className="ok">{labelFor(correct)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {result && (
                <Verdict
                    isCorrect={result.isCorrect}
                    explanation={result.explanation}
                />
            )}
        </>
    );
};

export default MatchingField;
