import type { Ref } from "react";
import type { DrillSummary } from "./drill-summary";
import { questionTypeLabel } from "./labels";

type Props = {
    summary: DrillSummary;
    titleId: string;
    headingRef: Ref<HTMLHeadingElement>;
    onSeeResults: () => void;
    onJump: (index: number) => void;
    onDismiss: () => void;
};

const ConfirmPhase = ({
    summary,
    titleId,
    headingRef,
    onSeeResults,
    onJump,
    onDismiss,
}: Props) => (
    <>
        <div className="modal-head">
            <div className="label">drill incomplete</div>
            <h2 id={titleId} ref={headingRef} tabIndex={-1}>
                {summary.unchecked.length} of {summary.total}{" "}
                {summary.unchecked.length === 1 ? "item is" : "items are"}{" "}
                unchecked
            </h2>
            <p>
                You haven&#39;t checked every question yet. Jump back to finish,
                or see results for what you have so far.
            </p>
        </div>
        <div className="modal-body">
            <ul className="modal-list" role="list">
                {summary.unchecked.map(({ question, index }) => (
                    <li key={question.id}>
                        <button
                            type="button"
                            onClick={() => onJump(index)}
                            aria-label={`Go to item ${index + 1}, ${questionTypeLabel(
                                question.question_type,
                            )}`}
                        >
                            <span className="n">item {index + 1}</span>
                            <span className="qt">
                                {questionTypeLabel(question.question_type)}
                            </span>
                            <span className="arrow" aria-hidden="true">
                                →
                            </span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
        <div className="modal-foot">
            <span className="hint">esc to dismiss</span>
            <span className="spacer" />
            <button type="button" className="btn" onClick={onSeeResults}>
                See results
            </button>
            <button type="button" className="btn primary" onClick={onDismiss}>
                Keep answering
            </button>
        </div>
    </>
);

export default ConfirmPhase;
