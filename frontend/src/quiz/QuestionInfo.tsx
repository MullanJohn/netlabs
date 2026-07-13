import { questionTypeLabel } from "./session/labels";
import type { QuizQuestion } from "./types/quiz-types";

const QuestionInfo = ({ question }: { question: QuizQuestion }) => (
    <div className="q-info">
        <div className="cell">
            <div className="lab">type</div>
            <div className="val accent">
                {questionTypeLabel(question.question_type)}
            </div>
        </div>
        <div className="cell">
            <div className="lab">topic</div>
            <div className="val">{question.sub_topic_id}</div>
        </div>
    </div>
);

export default QuestionInfo;
