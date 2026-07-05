import { useCallback, useReducer, useRef } from "react";
import {
    type QuizAnswer,
    type QuizAnswers,
    type QuizQuestion,
    type SubmissionResult,
} from "./types/quiz-types";
import { submitAnswer, toAnswerRequest } from "../data/quiz-client";
import { transportErrorMessage } from "../data/api-client";
import { isAnswerComplete } from "./answer";

type QuizState = {
    answers: QuizAnswers;
    results: Record<string, SubmissionResult>;
    checkingId: string | null;
    errors: Record<string, string | undefined>;
};

type QuizAction =
    | { kind: "set-answer"; questionId: string; answer: QuizAnswer }
    | { kind: "check-start"; questionId: string }
    | { kind: "check-success"; questionId: string; result: SubmissionResult }
    | { kind: "check-error"; questionId: string; message: string }
    | { kind: "reset" };

const initialState: QuizState = {
    answers: {},
    results: {},
    checkingId: null,
    errors: {},
};

function reducer(state: QuizState, action: QuizAction): QuizState {
    switch (action.kind) {
        case "set-answer": {
            if (state.checkingId === action.questionId) return state;
            const cleared = without(state, action.questionId);
            return {
                ...cleared,
                answers: {
                    ...cleared.answers,
                    [action.questionId]: action.answer,
                },
            };
        }
        case "reset":
            return initialState;
        case "check-start":
            if (state.checkingId || state.results[action.questionId]) {
                return state;
            }
            return {
                ...state,
                checkingId: action.questionId,
                errors: { ...state.errors, [action.questionId]: undefined },
            };
        case "check-success":
            if (state.checkingId !== action.questionId) return state;
            return {
                ...state,
                checkingId: null,
                results: {
                    ...state.results,
                    [action.questionId]: action.result,
                },
                errors: { ...state.errors, [action.questionId]: undefined },
            };
        case "check-error":
            return {
                ...state,
                checkingId: null,
                errors: {
                    ...state.errors,
                    [action.questionId]: action.message,
                },
            };
        default: {
            const _exhaustive: never = action;
            void _exhaustive;
            return state;
        }
    }
}

function without(state: QuizState, questionId: string): QuizState {
    const answers = { ...state.answers };
    const results = { ...state.results };
    const errors = { ...state.errors };
    delete answers[questionId];
    delete results[questionId];
    delete errors[questionId];
    return { ...state, answers, results, errors };
}

export function useQuizState(quizSlug: string | null) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const answersRef = useRef(state.answers);
    answersRef.current = state.answers;
    // Synchronous in-flight gate: a ref is always current (unlike a closure read
    // of state), so it reliably blocks a duplicate POST from a same-batch double
    // click before the reducer's check-start no-op can commit.
    const submittingRef = useRef(false);

    const setAnswer = useCallback(
        (questionId: string, answer: QuizAnswer) =>
            dispatch({ kind: "set-answer", questionId, answer }),
        [],
    );

    const reset = useCallback(() => dispatch({ kind: "reset" }), []);

    const checkAnswer = useCallback(
        (question: QuizQuestion) => {
            if (submittingRef.current) return;

            const questionId = question.id;
            const answer = answersRef.current[questionId];
            if (!answer || !isAnswerComplete(question, answer)) return;
            const request = toAnswerRequest(answer);
            if (!request) return;

            submittingRef.current = true;
            dispatch({ kind: "check-start", questionId });
            submitAnswer(quizSlug, questionId, request)
                .then((result) =>
                    dispatch({ kind: "check-success", questionId, result }),
                )
                .catch((error) =>
                    dispatch({
                        kind: "check-error",
                        questionId,
                        message:
                            transportErrorMessage(error) ??
                            "Couldn't check your answer. Please try again.",
                    }),
                )
                .finally(() => {
                    submittingRef.current = false;
                });
        },
        [quizSlug],
    );

    return {
        answers: state.answers,
        results: state.results,
        checkingId: state.checkingId,
        errors: state.errors,
        setAnswer,
        reset,
        checkAnswer,
    };
}
