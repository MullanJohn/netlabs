import type { Ref } from "react";
import type { DrillItemStatus, DrillSummary } from "./drill-summary";
import { questionTypeLabel } from "./labels";

const STATUS_CLASS: Record<DrillItemStatus, string> = {
    correct: "ok",
    incorrect: "err",
    unchecked: "skip",
};

const STATUS_MARK: Record<DrillItemStatus, string> = {
    correct: "✓",
    incorrect: "✗",
    unchecked: "–",
};

type Props = {
    summary: DrillSummary;
    titleId: string;
    headingRef: Ref<HTMLHeadingElement>;
    onRestart: () => void;
    onDismiss: () => void;
};

const SummaryPhase = ({
    summary,
    titleId,
    headingRef,
    onRestart,
    onDismiss,
}: Props) => (
    <>
        <div className="modal-head">
            <div className="label">drill complete</div>
            <h2 id={titleId} ref={headingRef} tabIndex={-1}>
                {summary.correct} / {summary.total} correct
            </h2>
            <p>
                Heads up: progress isn&#39;t saved. Screenshot this if you want
                to keep it.
            </p>
        </div>
        <div
            className="modal-body"
            tabIndex={0}
            role="group"
            aria-label="Drill results"
        >
            <div className="modal-score">
                <div className="cell">
                    <div className="lab">right</div>
                    <div className="val ok">{summary.correct}</div>
                </div>
                <div className="cell">
                    <div className="lab">wrong</div>
                    <div className={summary.incorrect ? "val err" : "val"}>
                        {summary.incorrect}
                    </div>
                </div>
                <div className="cell">
                    <div className="lab">unchecked</div>
                    <div className="val">{summary.unchecked.length}</div>
                </div>
            </div>
            <ul className="modal-breakdown" role="list">
                {summary.items.map(({ question, index, status }) => (
                    <li
                        key={question.id}
                        className={`row ${STATUS_CLASS[status]}`}
                    >
                        <span className="n">item {index + 1}</span>
                        <span>{questionTypeLabel(question.question_type)}</span>
                        <span className="ic">
                            <span aria-hidden="true">
                                {STATUS_MARK[status]}{" "}
                            </span>
                            {status}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
        <div className="modal-foot">
            <span className="hint">esc to dismiss</span>
            <span className="spacer" />
            <button type="button" className="btn" onClick={onRestart}>
                Restart drill
            </button>
            <button type="button" className="btn primary" onClick={onDismiss}>
                Review answers
            </button>
        </div>
    </>
);

export default SummaryPhase;
