import { useEffect, useRef, useState } from "react";
import { useQuizSession } from "./useQuizSession";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import SessionSidebar from "./SessionSidebar";
import EditorPane from "./EditorPane";
import { drillLabel } from "./labels";
import { canCheckAnswer } from "../answer";
import { stemDomId } from "../questions/QuestionPrompt";
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
        ? session.errorFor(currentQuestion.id)
        : undefined;
    const pendingStemFocus = useRef<FocusOptions | null>(null);
    const pendingAnnounce = useRef(false);
    const [liveMessage, setLiveMessage] = useState("");

    useEffect(() => {
        if (pendingAnnounce.current && (currentResult || currentError)) {
            pendingAnnounce.current = false;
            setLiveMessage(
                currentResult
                    ? currentResult.isCorrect
                        ? "Correct"
                        : "Incorrect"
                    : "",
            );
        }
        if (pendingStemFocus.current && currentQuestion) {
            const focusOptions = pendingStemFocus.current;
            pendingStemFocus.current = null;
            document
                .getElementById(stemDomId(currentQuestion.id))
                ?.focus(focusOptions);
        }
    }, [currentIndex, currentQuestion, currentResult, currentError]);

    function navigate(index: number) {
        if (index < 0 || index >= total) return;
        pendingStemFocus.current = { preventScroll: false };
        setLiveMessage("");
        goTo(index);
    }

    const goPrev = () => navigate(currentIndex - 1);
    const goNext = () => navigate(currentIndex + 1);

    function checkCurrent() {
        if (!currentQuestion) return;
        const answer = session.answers[currentQuestion.id];
        const checking = session.isChecking(currentQuestion.id);
        if (!canCheckAnswer(currentQuestion, answer, currentResult, checking)) {
            return;
        }
        pendingStemFocus.current = { preventScroll: true };
        pendingAnnounce.current = true;
        checkAnswer(currentQuestion);
    }

    useKeyboardShortcuts({
        ArrowLeft: goPrev,
        ArrowRight: goNext,
        Enter: checkCurrent,
    });

    return (
        <div className="main">
            <SessionSidebar session={session} drillName={drillName} />
            <EditorPane
                session={session}
                drillName={drillName}
                liveMessage={liveMessage}
                onNavigate={navigate}
                onCheck={checkCurrent}
            />
        </div>
    );
};

export default QuizSession;
