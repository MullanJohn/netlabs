import type {
    McqSingleQuestion,
    McqSingleResult,
    QuizAnswer,
} from "../types/quiz-types";
import QuestionPrompt, { optionLetter } from "../questions/QuestionPrompt";
import ResultOption from "./ResultOption";
import Verdict from "./Verdict";

type Props = {
    question: McqSingleQuestion;
    submittedAnswer: Extract<QuizAnswer, { type: "mcq-single" }>;
    result: McqSingleResult;
};

const MultipleChoiceResultView = ({
    question,
    submittedAnswer,
    result,
}: Props) => (
    <>
        <QuestionPrompt question={question} />
        <div className="opts">
            {question.options.map((option, index) => (
                <ResultOption
                    key={option.id}
                    letter={optionLetter(index)}
                    text={option.text}
                    isCorrect={result.correctOptionIds.includes(option.id)}
                    isSelected={option.id === submittedAnswer.optionId}
                />
            ))}
        </div>
        <Verdict isCorrect={result.isCorrect} explanation={result.explanation} />
    </>
);

export default MultipleChoiceResultView;
