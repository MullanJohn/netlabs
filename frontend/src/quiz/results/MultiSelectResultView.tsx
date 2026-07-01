import type {
    McqMultiQuestion,
    McqMultiResult,
    QuizAnswer,
} from "../types/quiz-types";
import QuestionPrompt, { optionLetter } from "../questions/QuestionPrompt";
import { mcqMultiHint } from "../questions/MultipleSelectQuestionView";
import ResultOption from "./ResultOption";
import Verdict from "./Verdict";

type Props = {
    question: McqMultiQuestion;
    submittedAnswer: Extract<QuizAnswer, { type: "mcq-multi" }>;
    result: McqMultiResult;
};

const MultiSelectResultView = ({ question, submittedAnswer, result }: Props) => (
    <>
        <QuestionPrompt question={question} sub={mcqMultiHint(question)} />
        <div className="opts">
            {question.options.map((option, index) => (
                <ResultOption
                    key={option.id}
                    letter={optionLetter(index)}
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
