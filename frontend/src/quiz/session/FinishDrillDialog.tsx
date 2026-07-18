import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { QuizQuestion, SubmissionResult } from "../types/quiz-types";
import { buildDrillSummary } from "./drill-summary";
import type { DrillSummary } from "./drill-summary";
import SummaryPhase from "./SummaryPhase";
import ConfirmPhase from "./ConfirmPhase";

type Props = {
    questions: QuizQuestion[];
    results: Record<string, SubmissionResult>;
    goTo: (index: number) => void;
    resetQuiz: () => void;
    open: boolean;
    onClose: () => void;
};

const FinishDrillDialog = ({
    questions,
    results,
    goTo,
    resetQuiz,
    open,
    onClose,
}: Props) => {
    const ref = useRef<HTMLDialogElement>(null);
    const headingRef = useRef<HTMLHeadingElement>(null);
    const titleId = useId();
    const [acknowledged, setAcknowledged] = useState(false);

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        if (open) {
            if (!dialog.open) dialog.showModal();
        } else {
            dialog.close();
        }
    }, [open]);

    useLayoutEffect(() => {
        if (open) setAcknowledged(false);
    }, [open]);

    const frozen = useRef<DrillSummary | null>(null);
    if (open || frozen.current === null) {
        frozen.current = buildDrillSummary(questions, results);
    }
    const summary = frozen.current;
    const showSummary = summary.allChecked || acknowledged;

    useEffect(() => {
        if (open) headingRef.current?.focus();
    }, [open, showSummary]);

    function dismiss() {
        ref.current?.close();
    }

    function jumpTo(index: number) {
        goTo(index);
        ref.current?.close();
    }

    function restart() {
        resetQuiz();
        ref.current?.close();
    }

    return (
        <dialog
            ref={ref}
            className="finish-dialog"
            aria-labelledby={titleId}
            onClose={onClose}
            onClick={(event) => {
                if (event.target === ref.current) dismiss();
            }}
        >
            <div className={showSummary ? "modal complete" : "modal"}>
                {showSummary ? (
                    <SummaryPhase
                        summary={summary}
                        titleId={titleId}
                        headingRef={headingRef}
                        onRestart={restart}
                        onDismiss={dismiss}
                    />
                ) : (
                    <ConfirmPhase
                        summary={summary}
                        titleId={titleId}
                        headingRef={headingRef}
                        onSeeResults={() => setAcknowledged(true)}
                        onJump={jumpTo}
                        onDismiss={dismiss}
                    />
                )}
            </div>
        </dialog>
    );
};

export default FinishDrillDialog;
