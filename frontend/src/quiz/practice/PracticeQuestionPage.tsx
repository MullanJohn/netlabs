import { useEffect, useMemo, useState } from "react";
import QuestionRenderer from "../QuestionRenderer";
import AnswerResultRenderer from "../AnswerResultRenderer";
import QuizStatus from "../QuizStatus";
import QuestionInfo from "../QuestionInfo";
import CheckButton from "../CheckButton";
import { useQuizState } from "../useQuizState";
import { useCheckFeedback } from "../useCheckFeedback";
import { useKeyboardShortcuts } from "../session/useKeyboardShortcuts";
import { canCheckAnswer } from "../answer";
import { fetchQuestion } from "../../data/quiz-client";
import { fetchBankQuestions } from "../../data/bank-client";
import { loadErrorMessage } from "../../data/api-client";
import { blueprintTopics } from "../../data/blueprint-topics";
import {
    BANK_SORTS,
    boostIdMatches,
    buildSearchIndex,
    computeBankView,
    sortQuestions,
    type BankSort,
} from "../../components/bank/bank-list";
import type { BankQuestion } from "../../data/bank-types";
import type { QuizQuestion } from "../types/quiz-types";

const VALID_TYPES = new Set([
    "mcq-single",
    "mcq-multi",
    "multi-tf",
    "matching",
    "drag-order",
    "fill-blank",
]);

type PracticeContext = {
    track: string;
    domain: string;
    type: string;
    query: string;
    sort: BankSort;
};

const PracticeQuestionPage = ({ questionId }: { questionId: string }) => {
    const context = useMemo(readContext, []);
    const [question, setQuestion] = useState<QuizQuestion | null>(null);
    const [bank, setBank] = useState<BankQuestion[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        setError(null);
        setQuestion(null);

        fetchQuestion(questionId, controller.signal)
            .then(setQuestion)
            .catch((err: unknown) => {
                if (controller.signal.aborted) return; // unmounted
                setError(
                    loadErrorMessage(
                        err,
                        "Question not found.",
                        "Something went wrong loading this question.",
                    ),
                );
            });

        return () => controller.abort();
    }, [questionId]);

    useEffect(() => {
        const controller = new AbortController();

        fetchBankQuestions(context.track, controller.signal)
            .then((data) => setBank(data.questions))
            .catch(() => {}); // navigation is optional; the question still works

        return () => controller.abort();
    }, [context.track]);

    const topicTitles = useMemo(
        () =>
            new Map(
                (blueprintTopics[context.track] ?? []).map((topic) => [
                    topic.id,
                    topic.title,
                ]),
            ),
        [context.track],
    );

    const navigation = useMemo(() => {
        if (!bank) return null;
        const searchIndex = buildSearchIndex(bank, topicTitles);
        const sorted = sortQuestions(bank, context.sort);
        const view = computeBankView(
            sorted,
            {
                domain: context.domain,
                type: context.type,
                query: context.query,
            },
            searchIndex,
        );
        const filtered = boostIdMatches(view.visible, context.query);
        return filtered.some((entry) => entry.id === questionId)
            ? { sequence: filtered, degraded: false }
            : { sequence: sorted, degraded: true };
    }, [bank, context, questionId, topicTitles]);
    const sequence = navigation?.sequence ?? null;

    const index = useMemo(
        () =>
            sequence
                ? sequence.findIndex((entry) => entry.id === questionId)
                : -1,
        [sequence, questionId],
    );
    const previous = sequence && index > 0 ? sequence[index - 1] : undefined;
    const next =
        sequence && index >= 0 && index < sequence.length - 1
            ? sequence[index + 1]
            : undefined;

    const quiz = useQuizState(null);

    const answer = question ? quiz.answers[question.id] : undefined;
    const result = question ? quiz.results[question.id] : undefined;
    const checkError = question ? quiz.errors[question.id] : undefined;
    const checking = question !== null && quiz.checkingId === question.id;
    const canCheck = question
        ? canCheckAnswer(question, answer, result, quiz.checkingId !== null)
        : false;
    const feedback = useCheckFeedback(question?.id, result, checkError);

    function check() {
        if (!question || !canCheck) return;
        feedback.armCheck(question.id);
        quiz.checkAnswer(question);
    }

    function fullBankHref(id: string): string {
        const params = new URLSearchParams();
        params.set("question", id);
        params.set("track", context.track);
        if (context.sort !== "id") params.set("sort", context.sort);
        return `/quiz?${params.toString()}`;
    }

    function navHref(id: string): string {
        if (navigation?.degraded) return fullBankHref(id);
        return contextHref(id);
    }

    function goTo(target: BankQuestion | undefined) {
        if (target) window.location.href = navHref(target.id);
    }

    function shuffle() {
        if (!sequence || sequence.length < 2) return;
        let pick: BankQuestion;
        do {
            pick = sequence[Math.floor(Math.random() * sequence.length)];
        } while (pick.id === questionId);
        window.location.href = navHref(pick.id);
    }

    useKeyboardShortcuts({
        ArrowLeft: () => goTo(previous),
        ArrowRight: () => goTo(next),
        Enter: check,
    });

    if (error) return <QuizStatus message={error} />;
    if (!question) return <QuizStatus message="Loading question…" />;

    return (
        <div className="main">
            <aside className="pane sidebar">
                <div className="sb-block">
                    <div className="sb-h">
                        <span>Question</span>
                    </div>
                    <div className="drill-name">{question.id}</div>
                    <div className="drill-meta">
                        {topicTitles.get(question.sub_topic_id) ??
                            question.sub_topic_id}
                    </div>
                    {sequence && index >= 0 && (
                        <div className="timer-row">
                            <span className="pos">
                                item <b>{index + 1}</b> /{" "}
                                <b>{sequence.length}</b>
                            </span>
                        </div>
                    )}
                    {isNarrowed(context) && !navigation?.degraded && (
                        <div className="drill-meta">
                            <a
                                className="scope-link"
                                href={fullBankHref(questionId)}
                            >
                                view in full bank →
                            </a>
                        </div>
                    )}
                </div>

                <div className="sb-block">
                    <div className="sb-h">
                        <span>This question</span>
                    </div>
                    <QuestionInfo question={question} />
                </div>

                <div className="sb-bottom">
                    <a className="btn primary" href={bankHref(context)}>
                        Back to bank
                    </a>
                </div>
            </aside>

            <section className="pane editor">
                <p className="visually-hidden" role="status">
                    {feedback.liveMessage}
                </p>
                <div className="top-bar">
                    <div className="breadcrumb">
                        <a href={bankHref(context)}>bank</a>{" "}
                        <span className="chev" aria-hidden="true">
                            ›
                        </span>{" "}
                        <b>{question.id}</b>{" "}
                        <span className="chev" aria-hidden="true">
                            ›
                        </span>{" "}
                        {question.sub_topic_id}
                    </div>
                    <div className="right">
                        <button
                            className="bank-random"
                            type="button"
                            aria-label="Pick one"
                            onClick={shuffle}
                            disabled={
                                !sequence || sequence.length < 2 || index === -1
                            }
                        >
                            <ShuffleIcon />
                        </button>
                    </div>
                </div>

                <div className="editor-body">
                    {result && answer ? (
                        <AnswerResultRenderer
                            question={question}
                            submittedAnswer={answer}
                            result={result}
                        />
                    ) : (
                        <QuestionRenderer
                            question={question}
                            answer={answer}
                            onAnswer={(nextAnswer) =>
                                quiz.setAnswer(question.id, nextAnswer)
                            }
                            onCheck={check}
                        />
                    )}

                    {checkError && (
                        <p className="check-error" role="alert">
                            {checkError}
                        </p>
                    )}
                </div>

                <div className="qfoot">
                    <div className="spacer" />
                    <nav className="nav-btns" aria-label="Question navigation">
                        {previous ? (
                            <a
                                className="btn"
                                href={navHref(previous.id)}
                                rel="prev"
                                aria-keyshortcuts="ArrowLeft"
                            >
                                ← Prev
                            </a>
                        ) : (
                            <span className="btn" aria-disabled="true">
                                ← Prev
                            </span>
                        )}
                        <CheckButton
                            hasResult={result !== undefined}
                            checking={checking}
                            disabled={!canCheck}
                            onClick={check}
                        />
                        {next ? (
                            <a
                                className="btn"
                                href={navHref(next.id)}
                                rel="next"
                                aria-keyshortcuts="ArrowRight"
                            >
                                Next →
                            </a>
                        ) : (
                            <span className="btn" aria-disabled="true">
                                Next →
                            </span>
                        )}
                    </nav>
                </div>
            </section>
        </div>
    );
};

const ShuffleIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.8-1.1 2-1.7 3.3-1.7H22" />
        <path d="m18 2 4 4-4 4" />
        <path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" />
        <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" />
        <path d="m18 14 4 4-4 4" />
    </svg>
);

function isNarrowed(context: PracticeContext): boolean {
    return (
        context.domain !== "all" ||
        context.type !== "all" ||
        context.query !== ""
    );
}

function readContext(): PracticeContext {
    const params = new URLSearchParams(window.location.search);
    const track = params.get("track") || "ccna";
    const domains = new Set(
        (blueprintTopics[track] ?? []).map((topic) => topic.domain),
    );
    const domain = params.get("domain") || "all";
    const type = params.get("type") || "all";
    const sort = params.get("sort") ?? "id";
    return {
        track,
        domain: domains.has(domain) ? domain : "all",
        type: VALID_TYPES.has(type) ? type : "all",
        query: params.get("q") || "",
        sort: (BANK_SORTS.has(sort) ? sort : "id") as BankSort,
    };
}

function contextHref(questionId: string): string {
    const params = new URLSearchParams(window.location.search);
    params.set("question", questionId);
    return `/quiz?${params.toString()}`;
}

function bankHref(context: PracticeContext): string {
    const params = new URLSearchParams(window.location.search);
    params.delete("question");
    params.delete("track");
    const encoded = params.toString();
    return `/${context.track}/bank${encoded ? `?${encoded}` : ""}`;
}

export default PracticeQuestionPage;
