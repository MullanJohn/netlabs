import { useQuizSession } from "./useQuizSession";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import SessionSidebar from "./SessionSidebar";
import EditorPane from "./EditorPane";
import { drillLabel } from "./labels";
import { canCheckAnswer } from "../answer";
import { useCheckFeedback } from "../useCheckFeedback";
import type { QuizQuestion } from "../types/quiz-types";

type Props = {
    quizId: string;
    questions: QuizQuestion[];
};

const QuizSession = ({ quizId, questions }: Props) => {
    const session = useQuizSession(quizId, questions);
    const drillName = drillLabel(quizId);
    const { currentIndex, currentQuestion, total, goTo, checkAnswer } = session;
    const currentResult = currentQuestion
        ? session.results[currentQuestion.id]
        : undefined;
    const currentError = currentQuestion
        ? session.errors[currentQuestion.id]
        : undefined;
    const feedback = useCheckFeedback(
        currentQuestion?.id,
        currentResult,
        currentError,
    );

    function navigate(index: number) {
        if (index < 0 || index >= total) return;
        feedback.armNavigate();
        goTo(index);
    }

    const goPrev = () => navigate(currentIndex - 1);
    const goNext = () => navigate(currentIndex + 1);

    function checkCurrent() {
        if (!currentQuestion) return;
        const answer = session.answers[currentQuestion.id];
        const checking = session.checkingId !== null;
        if (!canCheckAnswer(currentQuestion, answer, currentResult, checking)) {
            return;
        }
        feedback.armCheck(currentQuestion.id);
        checkAnswer(currentQuestion);
    }

    useKeyboardShortcuts({
        ArrowLeft: goPrev,
        ArrowRight: goNext,
        Enter: checkCurrent,
    });

    return (
        <div className="main">
            <SessionSidebar
                drillName={drillName}
                questions={session.questions}
                total={total}
                currentIndex={currentIndex}
                currentQuestion={currentQuestion}
                selectedCount={session.selectedCount}
                answeredKey={session.answeredKey}
                resetKey={session.resetKey}
                results={session.results}
                goTo={goTo}
                resetQuiz={session.resetQuiz}
            />
            <EditorPane
                session={session}
                drillName={drillName}
                liveMessage={feedback.liveMessage}
                onNavigate={navigate}
                onCheck={checkCurrent}
            />
        </div>
    );
};

export default QuizSession;
