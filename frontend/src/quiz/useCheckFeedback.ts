import { useEffect, useRef, useState } from "react";
import { stemDomId } from "./questions/QuestionPrompt";
import type { SubmissionResult } from "./types/quiz-types";

export function useCheckFeedback(
    questionId: string | undefined,
    result: SubmissionResult | undefined,
    error: string | undefined,
) {
    const pendingFocus = useRef<FocusOptions | null>(null);
    const pendingAnnounce = useRef<string | null>(null);
    const [liveMessage, setLiveMessage] = useState("");

    useEffect(() => {
        if (pendingAnnounce.current && pendingAnnounce.current !== questionId) {
            pendingAnnounce.current = null;
        }
        if (pendingAnnounce.current !== null && (result || error)) {
            pendingAnnounce.current = null;
            setLiveMessage(
                result ? (result.isCorrect ? "Correct" : "Incorrect") : "",
            );
        }
        if (pendingFocus.current && questionId) {
            const focusOptions = pendingFocus.current;
            pendingFocus.current = null;
            document.getElementById(stemDomId(questionId))?.focus(focusOptions);
        }
    }, [questionId, result, error]);

    function armCheck(id: string) {
        pendingFocus.current = { preventScroll: true };
        pendingAnnounce.current = id;
    }

    function armNavigate() {
        pendingFocus.current = { preventScroll: false };
        setLiveMessage("");
    }

    return { liveMessage, armCheck, armNavigate };
}
