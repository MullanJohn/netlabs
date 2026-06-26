import type {
    DragOrderQuestion,
    QuizAnswer,
    SubmissionResult,
} from "../types/quiz-types";
import QuestionPrompt from "../questions/QuestionPrompt";
import Verdict from "./Verdict";

type Props = {
    question: DragOrderQuestion;
    submittedAnswer: Extract<QuizAnswer, { type: "drag-order" }>;
    result: Extract<SubmissionResult, { type: "drag-order" | "matching" }>;
};

const DragOrderResultView = ({ question, submittedAnswer, result }: Props) => {
    const correctPairs = result.correctPairs;
    const optionText = (id: string | undefined) =>
        question.options.find((option) => option.id === id)?.text ?? "—";

    return (
        <>
            <QuestionPrompt question={question} />
            <div className="q-dnd-slots">
                {question.options.map((_, index) => {
                    const boxId = `answer-${index}`;
                    const placed = submittedAnswer.pairs[boxId];
                    const correct = correctPairs[boxId];
                    const isCorrect = correct !== undefined && placed === correct;

                    return (
                        <div
                            key={boxId}
                            className={
                                isCorrect ? "q-zone is-correct" : "q-zone is-wrong"
                            }
                        >
                            <span className="pos">{index + 1}</span>
                            <span className="placed">{optionText(placed)}</span>
                            <span className="visually-hidden">
                                {isCorrect ? "correct" : "incorrect"}
                            </span>
                            {!isCorrect && (
                                <span className="q-zone-correct">
                                    correct: {optionText(correct)}
                                </span>
                            )}
                            <span className="verdict-mark" aria-hidden="true">
                                {isCorrect ? "✓" : "✗"}
                            </span>
                        </div>
                    );
                })}
            </div>
            <Verdict isCorrect={result.isCorrect} explanation={result.explanation} />
        </>
    );
};

export default DragOrderResultView;
