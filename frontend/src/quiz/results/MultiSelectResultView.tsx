import type {
    McqMultiQuestion,
    QuizAnswer,
    SubmissionResult,
} from "../types/quiz-types";
import QuestionPrompt from "../questions/QuestionPrompt";
import ResultOption from "./ResultOption";
import Verdict from "./Verdict";

type Props = {
    question: McqMultiQuestion;
    submittedAnswer: Extract<QuizAnswer, { type: "mcq-multi" }>;
    result: Extract<
        SubmissionResult,
        { type: "mcq-single" | "mcq-multi" | "multi-tf" }
    >;
};

const MultiSelectResultView = ({ question, submittedAnswer, result }: Props) => (
    <>
        <QuestionPrompt question={question} />
        <div className="opts">
            {question.options.map((option, index) => (
                <ResultOption
                    key={option.id}
                    letter={String.fromCharCode(65 + index)}
                    text={option.text}
                    isCorrect={result.correctOptionIds.includes(option.id)}
                    isSelected={submittedAnswer.optionIds.includes(option.id)}
                />
            ))}
        </div>
        <Verdict isCorrect={result.isCorrect} explanation={result.explanation} />
    </>
);

export default MultiSelectResultView;
