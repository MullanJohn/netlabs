import type { ReactNode } from "react";
import type { QuizQuestion } from "../types/quiz-types";
import ExhibitView from "./ExhibitView";

export const stemDomId = (questionId: string) => `q-stem-${questionId}`;
export const subDomId = (questionId: string) => `q-sub-${questionId}`;
export const optionLetter = (index: number) => String.fromCharCode(65 + index);

type Props = {
    question: QuizQuestion;
    sub?: ReactNode;
};

const QuestionPrompt = ({ question, sub }: Props) => (
    <>
        <div className="q-meta-row">
            <span className="tag">{question.sub_topic_id}</span>
            <span className="id">{question.id}</span>
        </div>
        <h2 id={stemDomId(question.id)} className="q-prompt" tabIndex={-1}>
            {question.stem}
        </h2>
        {sub && (
            <p id={subDomId(question.id)} className="q-prompt-sub">
                {sub}
            </p>
        )}
        {question.exhibit && <ExhibitView exhibit={question.exhibit} />}
    </>
);

export default QuestionPrompt;
