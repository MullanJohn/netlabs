import type { FillBlankQuestion, SubmissionResult } from "../types/quiz-types";
import QuestionPrompt, { stemDomId, subDomId } from "./QuestionPrompt";
import Verdict from "../results/Verdict";

export const FILL_HINT = "Type your answer.";

type GradedResult = Extract<SubmissionResult, { type: "fill-blank" }>;

type Props = {
    question: FillBlankQuestion;
    text: string;
    onChange?: (value: string) => void;
    onSubmit?: () => void;
    result?: GradedResult;
};

const FillBlankQuestionView = ({
    question,
    text,
    onChange,
    onSubmit,
    result,
}: Props) => {
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
                    if (!result) onSubmit?.();
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
                            if (result) return;
                            onChange?.(event.target.value);
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
            {result && !isCorrect && (
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

export default FillBlankQuestionView;
