import { useEffect, useMemo, useState } from "react";
import { fetchQuizQuestions } from "../../data/quiz-client";
import { canCheckAnswer } from "../answer";
import { useQuizState } from "../quiz-hook";
import SampleQuestion from "./SampleQuestion";
import type { QuizQuestion } from "../types/quiz-types";

const SAMPLE_TYPES = ["mcq-single", "mcq-multi", "multi-tf", "fill-blank"];

function sampleQuestions(
    pool: readonly QuizQuestion[],
    count: number,
): QuizQuestion[] {
    const picked = [...pool];
    for (let i = picked.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [picked[i], picked[j]] = [picked[j], picked[i]];
    }
    return picked.slice(0, count);
}

type Props = {
    quizSlug?: string;
    count?: number;
};

const SampleQuiz = ({
    quizSlug = "ccna-review-all-domains",
    count = 3,
}: Props) => {
    const [pool, setPool] = useState<QuizQuestion[] | null>(null);
    const [failed, setFailed] = useState(false);
    const [index, setIndex] = useState(0);
    const [round, setRound] = useState(0);
    const quiz = useQuizState(quizSlug);

    useEffect(() => {
        const controller = new AbortController();
        setPool(null);
        setFailed(false);
        setIndex(0);

        fetchQuizQuestions(quizSlug, controller.signal)
            .then((questions) =>
                setPool(
                    questions.filter((question) =>
                        SAMPLE_TYPES.includes(question.question_type),
                    ),
                ),
            )
            .catch(() => {
                if (!controller.signal.aborted) setFailed(true);
            });

        return () => controller.abort();
    }, [quizSlug]);

    const questions = useMemo(
        () => (pool === null ? null : sampleQuestions(pool, count)),
        [pool, count, round],
    );

    if (failed || questions?.length === 0) {
        return (
            <div className="sample-quiz">
                <p className="sample-status" role="status">
                    The sample is unavailable right now — the question bank
                    lives at <a href="/ccna">/ccna</a>.
                </p>
            </div>
        );
    }
    if (!questions) {
        return (
            <div className="sample-quiz pending">
                <p className="sample-status" role="status">
                    Loading sample questions…
                </p>
            </div>
        );
    }

    if (index >= questions.length) {
        const score = questions.filter(
            (question) => quiz.results[question.id]?.isCorrect,
        ).length;

        return (
            <div className="sample-quiz">
                <p className="sample-score">
                    You got <b>{score} / {questions.length}</b> correct.
                </p>
                <div className="sample-foot">
                    <div className="spacer" />
                    <button
                        className="btn"
                        type="button"
                        onClick={() => {
                            quiz.reset();
                            setIndex(0);
                            setRound((value) => value + 1);
                        }}
                    >
                        Try another {questions.length}
                    </button>
                    <a className="btn primary" href="/ccna">
                        Browse the full bank →
                    </a>
                </div>
            </div>
        );
    }

    const question = questions[index];
    const answer = quiz.answers[question.id];
    const result = quiz.results[question.id];
    const checking = quiz.checkingId === question.id;
    const error = quiz.errors[question.id];
    const canCheck = canCheckAnswer(
        question,
        answer,
        result,
        quiz.checkingId !== null,
    );
    const isLast = index === questions.length - 1;

    return (
        <div className="sample-quiz">
            <SampleQuestion
                question={question}
                answer={answer}
                result={result}
                onAnswer={(next) => quiz.setAnswer(question.id, next)}
                onCheck={() => quiz.checkAnswer(question)}
            />

            {error && (
                <p className="check-error" role="alert">
                    {error}
                </p>
            )}

            <div className="sample-foot">
                <span className="progress">
                    {index + 1} / {questions.length}
                </span>
                <div className="spacer" />
                {result ? (
                    <button
                        className="btn primary"
                        type="button"
                        onClick={() => setIndex(index + 1)}
                    >
                        {isLast ? "Show score →" : "Next →"}
                    </button>
                ) : (
                    <button
                        className="btn primary"
                        type="button"
                        onClick={() => quiz.checkAnswer(question)}
                        disabled={!canCheck}
                    >
                        {checking ? "Checking…" : "Check answer"}
                    </button>
                )}
            </div>
        </div>
    );
};

export default SampleQuiz;
