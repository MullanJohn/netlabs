import { memo, useState } from "react";
import type { QuizQuestion, SubmissionResult } from "../types/quiz-types";
import { useStopwatch, formatElapsed } from "./useStopwatch";
import QuestionInfo from "../QuestionInfo";
import QuestionNavigator from "./QuestionNavigator";
import FinishDrillDialog from "./FinishDrillDialog";

type Props = {
    drillName: string;
    questions: QuizQuestion[];
    total: number;
    currentIndex: number;
    currentQuestion: QuizQuestion | undefined;
    selectedCount: number;
    answeredKey: string;
    resetKey: number;
    results: Record<string, SubmissionResult>;
    goTo: (index: number) => void;
    resetQuiz: () => void;
};

const SessionSidebar = ({
    drillName,
    questions,
    total,
    currentIndex,
    currentQuestion,
    selectedCount,
    answeredKey,
    resetKey,
    results,
    goTo,
    resetQuiz,
}: Props) => {
    const [finishOpen, setFinishOpen] = useState(false);

    return (
        <aside className="pane sidebar">
            <div className="sb-block">
                <div className="sb-h">
                    <span>Drill</span>
                </div>
                <div className="drill-name">{drillName}</div>
                <div className="drill-meta">
                    <b>{total}</b> {total === 1 ? "item" : "items"}
                </div>
                <div className="timer-row">
                    <span className="pos">
                        item <b>{currentIndex + 1}</b> / <b>{total}</b>
                    </span>
                    <ElapsedTimer key={resetKey} />
                </div>
                <ProgressBar total={total} currentIndex={currentIndex} />
            </div>

            <div className="sb-block">
                <div className="sb-h">
                    <span>Navigator</span>
                    <span className="more">
                        <b>{selectedCount}</b>/{total} answered
                    </span>
                </div>
                <QuestionNavigator
                    questions={questions}
                    currentIndex={currentIndex}
                    results={results}
                    answeredKey={answeredKey}
                    goTo={goTo}
                />
            </div>

            {currentQuestion && (
                <div className="sb-block">
                    <div className="sb-h">
                        <span>This question</span>
                    </div>
                    <QuestionInfo question={currentQuestion} />
                </div>
            )}

            <div className="sb-bottom">
                <button
                    className="btn primary"
                    type="button"
                    onClick={() => setFinishOpen(true)}
                    disabled={total === 0}
                >
                    Finish drill
                </button>
                <FinishDrillDialog
                    questions={questions}
                    results={results}
                    goTo={goTo}
                    resetQuiz={resetQuiz}
                    open={finishOpen}
                    onClose={() => setFinishOpen(false)}
                />
            </div>
        </aside>
    );
};

const ElapsedTimer = () => {
    const elapsedSeconds = useStopwatch();
    return (
        <span className="elapsed" role="timer" aria-live="off">
            <span className="visually-hidden">Elapsed </span>
            {formatElapsed(elapsedSeconds)}
        </span>
    );
};

type ProgressBarProps = {
    total: number;
    currentIndex: number;
};

const ProgressBar = ({ total, currentIndex }: ProgressBarProps) => (
    <div className="progress-bar">
        {Array.from({ length: total }, (_, index) => (
            <span key={index} className={index === currentIndex ? "current" : ""} />
        ))}
    </div>
);

export default memo(SessionSidebar);
