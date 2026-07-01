import { useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import type { QuizQuestion, SubmissionResult } from "../types/quiz-types";
import { resultStatus } from "./drill-summary";
import { questionTypeLabel, questionTypeShort } from "./labels";

type NavStatus = "correct" | "incorrect" | "answered" | "unanswered";

const STATUS: Record<
    NavStatus,
    { class: string; mark: string; word: string }
> = {
    correct: { class: "is-correct", mark: "✓", word: "correct" },
    incorrect: { class: "is-wrong", mark: "✗", word: "incorrect" },
    answered: { class: "is-answered", mark: "•", word: "answered, not checked" },
    unanswered: { class: "", mark: "", word: "not answered" },
};

function navStatus(
    question: QuizQuestion,
    index: number,
    results: Record<string, SubmissionResult>,
    answeredKey: string,
): NavStatus {
    const status = resultStatus(results[question.id]);
    if (status !== "unchecked") return status;
    return answeredKey[index] === "1" ? "answered" : "unanswered";
}

type Props = {
    questions: QuizQuestion[];
    currentIndex: number;
    results: Record<string, SubmissionResult>;
    answeredKey: string;
    goTo: (index: number) => void;
};

const QuestionNavigator = ({
    questions,
    currentIndex,
    results,
    answeredKey,
    goTo,
}: Props) => {
    const railRef = useRef<HTMLDivElement>(null);
    const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);

    useEffect(() => {
        const rail = railRef.current;
        const active = rail?.querySelector<HTMLElement>(".nav-cell.current");
        if (!rail || !active) return;
        const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        rail.scrollTo({
            left:
                active.offsetLeft - (rail.clientWidth - active.clientWidth) / 2,
            behavior: reduceMotion ? "auto" : "smooth",
        });
    }, [currentIndex]);

    function go(index: number) {
        goTo(index);
        cellRefs.current[index]?.focus({ preventScroll: true });
    }

    function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        const last = questions.length - 1;
        switch (event.key) {
            case "ArrowRight":
            case "ArrowDown":
                event.preventDefault();
                go(currentIndex >= last ? 0 : currentIndex + 1);
                break;
            case "ArrowLeft":
            case "ArrowUp":
                event.preventDefault();
                go(currentIndex <= 0 ? last : currentIndex - 1);
                break;
            case "Home":
                event.preventDefault();
                go(0);
                break;
            case "End":
                event.preventDefault();
                go(last);
                break;
        }
    }

    return (
        <div
            className="nav-rail"
            ref={railRef}
            role="group"
            aria-label="Question navigator"
            data-arrow-owner=""
            onKeyDown={onKeyDown}
        >
            {questions.map((question, index) => {
                const isCurrent = index === currentIndex;
                const { class: statusClass, mark, word } =
                    STATUS[navStatus(question, index, results, answeredKey)];
                const label = `Question ${index + 1}, ${questionTypeLabel(
                    question.question_type,
                )}, ${word}`;
                return (
                    <button
                        key={question.id}
                        ref={(node) => {
                            cellRefs.current[index] = node;
                        }}
                        type="button"
                        className={[
                            "nav-cell",
                            isCurrent ? "current" : "",
                            statusClass,
                        ]
                            .filter(Boolean)
                            .join(" ")}
                        tabIndex={isCurrent ? 0 : -1}
                        aria-label={label}
                        aria-current={isCurrent ? "step" : undefined}
                        onClick={() => go(index)}
                    >
                        <span className="num">{index + 1}</span>
                        <span className="qtype" aria-hidden="true">
                            {questionTypeShort(question.question_type)}
                        </span>
                        {mark && (
                            <span className="mark" aria-hidden="true">
                                {mark}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default QuestionNavigator;
