import type { QuizSessionApi } from "./useQuizSession";
import QuestionRenderer from "../QuestionRenderer";

type Props = {
    session: QuizSessionApi;
    drillName: string;
};

const EditorPane = ({ session, drillName }: Props) => {
    const {
        currentQuestion,
        currentIndex,
        total,
        answers,
        goTo,
        selectSingleOption,
        toggleMultiSelectOption,
        updateDragOrderAnswer,
    } = session;

    if (!currentQuestion) return null;

    return (
        <section className="pane editor">
            <div className="top-bar">
                <div className="breadcrumb">
                    drill <span className="chev" aria-hidden="true">›</span>{" "}
                    {drillName}{" "}
                    <span className="chev" aria-hidden="true">›</span>{" "}
                    <b>item {currentIndex + 1}</b>
                </div>
            </div>

            <div className="editor-body">
                <QuestionRenderer
                    question={currentQuestion}
                    answer={answers[currentQuestion.id]}
                    onSelectSingle={selectSingleOption}
                    onToggleMulti={toggleMultiSelectOption}
                    onUpdateDragOrder={updateDragOrderAnswer}
                />
            </div>

            <div className="qfoot">
                <div className="spacer" />
                <div className="nav-btns">
                    <button
                        className="btn"
                        type="button"
                        onClick={() => goTo(currentIndex - 1)}
                        disabled={currentIndex === 0}
                    >
                        ← Prev
                    </button>
                    <button className="btn primary" type="button" disabled>
                        Check answer
                    </button>
                    <button
                        className="btn"
                        type="button"
                        onClick={() => goTo(currentIndex + 1)}
                        disabled={currentIndex === total - 1}
                    >
                        Next →
                    </button>
                </div>
            </div>
        </section>
    );
};

export default EditorPane;
