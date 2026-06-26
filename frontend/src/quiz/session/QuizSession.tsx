import { useQuizSession } from "./useQuizSession";
import SessionSidebar from "./SessionSidebar";
import EditorPane from "./EditorPane";
import { drillLabel } from "./labels";
import type { QuizQuestion } from "../types/quiz-types";

type Props = {
    quizId: string;
    questions: QuizQuestion[];
};

const QuizSession = ({ quizId, questions }: Props) => {
    const session = useQuizSession(quizId, questions);
    const drillName = drillLabel(quizId);

    return (
        <div className="main">
            <SessionSidebar session={session} drillName={drillName} />
            <EditorPane session={session} drillName={drillName} />
        </div>
    );
};

export default QuizSession;
