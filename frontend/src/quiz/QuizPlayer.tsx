import { useEffect, useState } from "react";
import QuestionRenderer from "./QuestionRenderer";
import AnswerResultRenderer from "./AnswerResultRenderer";
import { useQuizAnswers } from "./quiz-hook";
import type { QuizAnswer, QuizQuestion } from "./types/quiz-types";
import { validateAnswer, submitAnswer } from "./answer";

type QuizPlayerProps = {
    quizId: string;
    initialQuestion: QuizQuestion;
};

const QuizPlayer = ({ quizId, initialQuestion }: QuizPlayerProps) => {
    const {
        answers,
        selectSingleOption,
        toggleMultiSelectOption,
        updateDragDropAnswer,
    } = useQuizAnswers();
    const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(
        initialQuestion,
    );
    const [nextQuestion, setNextQuestion] = useState<QuizQuestion | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [submittedAnswer, setSubmittedAnswer] = useState<QuizAnswer | null>(
        null,
    );
    const [submissionResult, setSubmissionResult] =
        useState<SubmissionResult | null>(null);

    const answer = answers[currentQuestion.id];

    useEffect(() => {
        setError(null);
        setSubmittedAnswer(null);
    }, [currentQuestion.id]);

    const handleSubmit = async () => {
        const validationError = validateAnswer(currentQuestion, answer);

        if (validationError) {
            setError(validationError);
            return;
        }

        setError(null);

        try {
            const response = await submitAnswer(
                quizId,
                currentQuestion.id,
                answer,
            );
            setSubmittedAnswer(answer);
            setSubmissionResult(response.result);
            setNextQuestion(response.nextQuestion);
        } catch {
            setError("Something went wrong while submitting your answer.");
        }
    };

    const handleNextQuestion = () => {
        setCurrentQuestion(nextQuestion);
        setSubmittedAnswer(null);
        setError(null);
    };

    return (
        <>
            {submittedAnswer ? (
                <AnswerResultRenderer
                    question={currentQuestion}
                    submittedAnswer={submittedAnswer}
                    result={submissionResult}
                />
            ) : (
                <QuestionRenderer
                    question={currentQuestion}
                    answer={answer}
                    onSelectSingle={selectSingleOption}
                    onToggleMulti={toggleMultiSelectOption}
                    onUpdateDragDrop={updateDragDropAnswer}
                />
            )}

            {error && <p className="text-red-500">{error}</p>}
            {submittedAnswer ? (
                <button onClick={handleNextQuestion}>Next Question</button>
            ) : (
                <button onClick={handleSubmit}>Submit</button>
            )}
        </>
    );
};

export default QuizPlayer;
