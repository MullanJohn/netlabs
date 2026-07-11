import type { BaseQuestion } from "../quiz/types/quiz-types";

export type BankQuestion = {
    id: string;
    topic_id: string;
    sub_topic_id: string;
    question_type: BaseQuestion["question_type"];
    stem: string;
};

export type BankQuestionListResponse = {
    total: number;
    questions: BankQuestion[];
};
