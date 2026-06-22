import type { QuizSessionApi } from "./useQuizSession";
import { questionTypeLabel } from "./labels";
import QuestionNavigator from "./QuestionNavigator";

type Props = {
    session: QuizSessionApi;
    drillName: string;
};

const SessionSidebar = ({ session, drillName }: Props) => {
    const { total, currentIndex, answeredCount, currentQuestion } = session;

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
                </div>
                <ProgressBar total={total} currentIndex={currentIndex} />
            </div>

            <div className="sb-block">
                <div className="sb-h">
                    <span>Navigator</span>
                    <span className="more">
                        <b>{answeredCount}</b>/{total} answered
                    </span>
                </div>
                <QuestionNavigator session={session} />
            </div>

            {currentQuestion && (
                <div className="sb-block">
                    <div className="sb-h">
                        <span>This question</span>
                    </div>
                    <div className="q-info">
                        <div className="cell">
                            <div className="lab">type</div>
                            <div className="val accent">
                                {questionTypeLabel(currentQuestion.question_type)}
                            </div>
                        </div>
                        <div className="cell">
                            <div className="lab">topic</div>
                            <div className="val">{currentQuestion.topic_id}</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="sb-bottom">
                <button className="btn primary" type="button" disabled>
                    Finish drill
                </button>
            </div>
        </aside>
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

export default SessionSidebar;
