import type {
    DragDropQuestion,
    QuizAnswer,
    SubmissionResult,
} from "./types/quiz-types";

type DragDropResultViewProps = {
    question: DragDropQuestion;
    submittedAnswer: Extract<QuizAnswer, { type: "drag-drop" }>;
    result: SubmissionResult;
};

const DragDropResultView = ({
    question,
    submittedAnswer,
    result,
}: DragDropResultViewProps) => {
    const correctPairs = result.correctPairs ?? {};

    return (
        <div>
            <h2>{question.stem}</h2>

            <p>{result.isCorrect ? "Correct" : "Incorrect"}</p>

            <section>
                <div className="space-y-2">
                    {question.options.map((_, index) => {
                        const boxId = `answer-${index}`;

                        const selectedOption = submittedAnswer.pairs[boxId];
                        const correctOption = correctPairs[boxId];

                        const isCorrect = selectedOption === correctOption;

                        return (
                            <div
                                key={boxId}
                                className={
                                    isCorrect
                                        ? "rounded border border-green-500 p-2"
                                        : "rounded border border-red-500 p-2"
                                }
                            >
                                {selectedOption ?? "No answer"}
                            </div>
                        );
                    })}
                </div>
            </section>

            {!result.isCorrect && (
                <section>
                    <h3>Correct order</h3>

                    <div className="space-y-2">
                        {question.options.map((_, index) => {
                            const boxId = `answer-${index}`;
                            const correctLetter = correctPairs[boxId];

                            return (
                                <div
                                    key={boxId}
                                    className="rounded border border-gray-300 p-2"
                                >
                                    {correctLetter ?? "No answer"}
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {result.explanation && <p>{result.explanation}</p>}
        </div>
    );
};

export default DragDropResultView;
