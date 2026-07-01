import type { FillBlankQuestion, SubmissionResult } from "../types/quiz-types";
import QuestionPrompt, { stemDomId, subDomId } from "../questions/QuestionPrompt";
import Verdict from "../results/Verdict";

export const FILL_HINT = "Type your answer.";

type GradedResult = Extract<SubmissionResult, { type: "fill-blank" }>;

type Base = { question: FillBlankQuestion; text: string };
type Props =
    | (Base & {
          mode: "attempt";
          onChange: (value: string) => void;
          onSubmit: () => void;
      })
    | (Base & { mode: "graded"; result: GradedResult });

const FillBlankField = (props: Props) => {
    const { question, text } = props;
    const result = props.mode === "graded" ? props.result : null;
    const isCorrect = result?.isCorrect ?? false;
    const rowClass = !result
        ? "q-fill-row"
        : isCorrect
          ? "q-fill-row is-correct"
          : "q-fill-row is-wrong";

    return (
        <>
            <QuestionPrompt question={question} sub={FILL_HINT} />
            <form
                className="q-fill-wrap"
                onSubmit={(event) => {
                    event.preventDefault();
                    if (props.mode === "attempt") props.onSubmit();
                }}
            >
                <div className={rowClass}>
                    <input
                        type="text"
                        className="q-fill"
                        value={result ? text.trim() || "—" : text}
                        readOnly={result ? true : undefined}
                        tabIndex={result ? -1 : undefined}
                        placeholder={result ? undefined : "type answer…"}
                        aria-labelledby={stemDomId(question.id)}
                        aria-describedby={subDomId(question.id)}
                        autoComplete="off"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        enterKeyHint="go"
                        onChange={(event) => {
                            if (props.mode !== "attempt") return;
                            props.onChange(event.target.value);
                        }}
                    />
                    <span className="q-fill-mark" aria-hidden="true">
                        {result ? (isCorrect ? "✓" : "✗") : ""}
                    </span>
                </div>
                {result && (
                    <span className="visually-hidden">
                        {isCorrect ? "correct" : "incorrect"}
                    </span>
                )}
            </form>
            {result && !result.isCorrect && (
                <p className="q-fill-accepted">
                    <span className="label">accepted</span>
                    {result.acceptedAnswers.map((accepted) => (
                        <span key={accepted} className="kbd">
                            {accepted}
                        </span>
                    ))}
                </p>
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

export default FillBlankField;
