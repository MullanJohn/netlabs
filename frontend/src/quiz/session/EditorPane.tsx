import type { QuizSessionApi } from "./useQuizSession";
import QuestionRenderer from "../QuestionRenderer";
import AnswerResultRenderer from "../AnswerResultRenderer";
import { canCheckAnswer } from "../answer";

type Props = {
    session: QuizSessionApi;
    drillName: string;
    liveMessage: string;
    onNavigate: (index: number) => void;
    onCheck: () => void;
};

const EditorPane = ({
    session,
    drillName,
    liveMessage,
    onNavigate,
    onCheck,
}: Props) => {
    const {
        currentQuestion,
        currentIndex,
        total,
        answers,
        results,
        isChecking,
        errorFor,
        selectSingleOption,
        toggleMultiSelectOption,
        updateDragOrderAnswer,
    } = session;

    if (!currentQuestion) return null;

    const answer = answers[currentQuestion.id];
    const result = results[currentQuestion.id];
    const checking = isChecking(currentQuestion.id);
    const error = errorFor(currentQuestion.id);
    const canCheck = canCheckAnswer(currentQuestion, answer, result, checking);

    return (
        <section className="pane editor">
            <p className="visually-hidden" role="status">
                {liveMessage}
            </p>
            <div className="top-bar">
                <div className="breadcrumb">
                    drill{" "}
                    <span className="chev" aria-hidden="true">
                        ›
                    </span>{" "}
                    {drillName}{" "}
                    <span className="chev" aria-hidden="true">
                        ›
                    </span>{" "}
                    <b>item {currentIndex + 1}</b>
                </div>
            </div>

            <div className="editor-body">
                {result && answer ? (
                    <AnswerResultRenderer
                        question={currentQuestion}
                        submittedAnswer={answer}
                        result={result}
                    />
                ) : (
                    <QuestionRenderer
                        question={currentQuestion}
                        answer={answer}
                        onSelectSingle={selectSingleOption}
                        onToggleMulti={toggleMultiSelectOption}
                        onUpdateDragOrder={updateDragOrderAnswer}
                    />
                )}

                {error && (
                    <p className="check-error" role="alert">
                        {error}
                    </p>
                )}
            </div>

            <div className="qfoot">
                <div className="spacer" />
                <div className="nav-btns">
                    <button
                        className="btn"
                        type="button"
                        onClick={() => onNavigate(currentIndex - 1)}
                        disabled={currentIndex === 0}
                        aria-keyshortcuts="ArrowLeft"
                    >
                        ← Prev
                    </button>
                    <button
                        className="btn primary"
                        type="button"
                        onClick={onCheck}
                        disabled={!canCheck}
                        aria-keyshortcuts="Enter"
                    >
                        {result
                            ? "Checked"
                            : checking
                              ? "Checking…"
                              : "Check answer"}
                    </button>
                    <button
                        className="btn"
                        type="button"
                        onClick={() => onNavigate(currentIndex + 1)}
                        disabled={currentIndex === total - 1}
                        aria-keyshortcuts="ArrowRight"
                    >
                        Next →
                    </button>
                </div>
            </div>
        </section>
    );
};

export default EditorPane;
