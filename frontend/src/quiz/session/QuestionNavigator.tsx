import { useEffect, useRef } from "react";
import type { QuizSessionApi } from "./useQuizSession";
import { questionTypeLabel, questionTypeShort } from "./labels";

type Props = {
    session: QuizSessionApi;
};

const QuestionNavigator = ({ session }: Props) => {
    const { questions, currentIndex, goTo } = session;
    const railRef = useRef<HTMLDivElement>(null);

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

    return (
        <div className="nav-rail" ref={railRef}>
            {questions.map((question, index) => (
                <button
                    key={question.id}
                    type="button"
                    className={`nav-cell${index === currentIndex ? " current" : ""}`}
                    aria-label={`Question ${index + 1}, ${questionTypeLabel(question.question_type)}`}
                    aria-current={index === currentIndex ? "true" : undefined}
                    onClick={() => goTo(index)}
                >
                    <span className="num">{index + 1}</span>
                    <span className="qtype" aria-hidden="true">
                        {questionTypeShort(question.question_type)}
                    </span>
                </button>
            ))}
        </div>
    );
};

export default QuestionNavigator;
