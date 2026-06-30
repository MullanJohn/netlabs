import { useReducer, useRef } from "react";
import {
    type QuizAnswer,
    type QuizAnswers,
    type QuizQuestion,
    type SubmissionResult,
} from "./types/quiz-types";
import { submitAnswer, toAnswerRequest } from "../data/quiz-client";
import { ApiError } from "../data/api-client";
import { validateAnswer } from "./answer";

type QuizState = {
    answers: QuizAnswers;
    results: Record<string, SubmissionResult>;
    checkingId: string | null;
    errors: Record<string, string | undefined>;
};

type QuizAction =
    | { kind: "select-single"; questionId: string; optionId: string }
    | {
          kind: "toggle-multi";
          questionId: string;
          optionId: string;
          selectCount: number;
      }
    | {
          kind: "update-drag";
          questionId: string;
          pairs: Partial<Record<string, string>>;
      }
    | {
          kind: "update-matching";
          questionId: string;
          pairs: Partial<Record<string, string>>;
      }
    | {
          kind: "set-tf";
          questionId: string;
          optionId: string;
          value: boolean;
      }
    | { kind: "update-fill-blank"; questionId: string; text: string }
    | { kind: "clear"; questionId: string }
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
        case "select-single":
            return setAnswer(state, action.questionId, {
                type: "mcq-single",
                optionId: action.optionId,
            });
        case "toggle-multi": {
            const current = state.answers[action.questionId];
            const currentIds =
                current?.type === "mcq-multi" ? current.optionIds : [];
            if (
                currentIds.length >= action.selectCount &&
                !currentIds.includes(action.optionId)
            ) {
                return state;
            }
            const nextIds = currentIds.includes(action.optionId)
                ? currentIds.filter((id) => id !== action.optionId)
                : [...currentIds, action.optionId];
            return setAnswer(state, action.questionId, {
                type: "mcq-multi",
                optionIds: nextIds,
            });
        }
        case "update-drag":
            return setAnswer(state, action.questionId, {
                type: "drag-order",
                pairs: action.pairs,
            });
        case "update-matching":
            return setAnswer(state, action.questionId, {
                type: "matching",
                pairs: action.pairs,
            });
        case "set-tf": {
            const current = state.answers[action.questionId];
            const currentVerdicts =
                current?.type === "multi-tf" ? current.verdicts : {};
            return setAnswer(state, action.questionId, {
                type: "multi-tf",
                verdicts: {
                    ...currentVerdicts,
                    [action.optionId]: action.value,
                },
            });
        }
        case "update-fill-blank":
            return setAnswer(state, action.questionId, {
                type: "fill-blank",
                text: action.text,
            });
        case "clear":
            return without(state, action.questionId);
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

function setAnswer(
    state: QuizState,
    questionId: string,
    answer: QuizAnswer,
): QuizState {
    const cleared = without(state, questionId);
    return {
        ...cleared,
        answers: { ...cleared.answers, [questionId]: answer },
    };
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

export function useQuizState(quizSlug: string) {
    const [state, dispatch] = useReducer(reducer, initialState);
    // Synchronous in-flight gate: a ref is always current (unlike a closure read
    // of state), so it reliably blocks a duplicate POST from a same-batch double
    // click before the reducer's check-start no-op can commit.
    const submittingRef = useRef(false);

    function checkAnswer(question: QuizQuestion) {
        if (submittingRef.current) return;

        const needsAnswer = "Please answer before checking.";
        const questionId = question.id;
        const answer = state.answers[questionId];
        const validationError = answer
            ? validateAnswer(question, answer)
            : needsAnswer;
        const request = answer ? toAnswerRequest(answer) : null;

        if (validationError || !request) {
            dispatch({
                kind: "check-error",
                questionId,
                message: validationError ?? needsAnswer,
            });
            return;
        }

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
                    message: checkErrorMessage(error),
                }),
            )
            .finally(() => {
                submittingRef.current = false;
            });
    }

    return {
        answers: state.answers,
        results: state.results,
        checkingId: state.checkingId,
        errors: state.errors,
        selectSingleOption: (questionId: string, optionId: string) =>
            dispatch({ kind: "select-single", questionId, optionId }),
        toggleMultiSelectOption: (
            questionId: string,
            optionId: string,
            selectCount: number,
        ) =>
            dispatch({
                kind: "toggle-multi",
                questionId,
                optionId,
                selectCount,
            }),
        updateDragOrderAnswer: (
            questionId: string,
            pairs: Partial<Record<string, string>>,
        ) => dispatch({ kind: "update-drag", questionId, pairs }),
        updateMatchingAnswer: (
            questionId: string,
            pairs: Partial<Record<string, string>>,
        ) => dispatch({ kind: "update-matching", questionId, pairs }),
        setTrueFalse: (questionId: string, optionId: string, value: boolean) =>
            dispatch({ kind: "set-tf", questionId, optionId, value }),
        updateFillBlank: (questionId: string, text: string) =>
            dispatch({ kind: "update-fill-blank", questionId, text }),
        clearAnswer: (questionId: string) =>
            dispatch({ kind: "clear", questionId }),
        reset: () => dispatch({ kind: "reset" }),
        checkAnswer,
    };
}

function checkErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        if (error.kind === "network") {
            return "Couldn't reach the server. Please try again.";
        }
        if (error.kind === "server") {
            return "The server had a problem. Please try again.";
        }
    }
    return "Couldn't check your answer. Please try again.";
}
