export type QuizQuestion =
    | McqSingleQuestion
    | McqMultiQuestion
    | DragOrderQuestion
    | MatchingQuestion
    | MultiTfQuestion
    | FillBlankQuestion;

export type BaseQuestion = {
    id: string;

    /**
     * Broad exam topic, e.g.:
     * "4.0" = IP Services
     */
    topic_id: string;

    /**
     * Specific source section, e.g.:
     * "4.6" = DHCP client and relay
     */
    sub_topic_id: string;

    question_type:
        | "mcq-single"
        | "mcq-multi"
        | "drag-order"
        | "matching"
        | "multi-tf"
        | "fill-blank";
    stem: string;
    exhibit?: Exhibit;
    options: QuestionOption[];
};

export type McqSingleQuestion = BaseQuestion & {
    question_type: "mcq-single";
};

export type McqMultiQuestion = BaseQuestion & {
    question_type: "mcq-multi";
    select_count: number;
};

export type DragOrderQuestion = BaseQuestion & {
    question_type: "drag-order";
};

export type MatchingQuestion = BaseQuestion & {
    question_type: "matching";
    premises: Premise[];
};

export type MultiTfQuestion = BaseQuestion & {
    question_type: "multi-tf";
};

export type FillBlankQuestion = BaseQuestion & {
    question_type: "fill-blank";
};

export type QuestionOption = {
    id: string;
    text: string;
};

export type Premise = {
    id: string;
    text: string;
};

export type Exhibit = {
    type:
        | "show-output"
        | "config-snippet"
        | "topology-table"
        | "code-snippet"
        | "diagram-mermaid"
        | "diagram-png";
    content: string;
};

export type QuizAnswer =
    | { type: "mcq-single"; optionId: string | null }
    | { type: "mcq-multi"; optionIds: string[] }
    | { type: "drag-order"; pairs: Partial<Record<string, string>> }
    | { type: "matching"; pairs: Partial<Record<string, string>> }
    | { type: "multi-tf"; verdicts: Partial<Record<string, boolean>> }
    | { type: "fill-blank"; text: string };

export type QuizAnswers = Record<string, QuizAnswer>;

export type AnswerRequest =
    | { type: "mcq-single"; answer: string }
    | { type: "mcq-multi"; answer: string[] }
    | { type: "drag-order"; answer: string[] }
    | { type: "matching"; answer: Record<string, string> }
    | { type: "multi-tf"; answer: string[] }
    | { type: "fill-blank"; answer: string };

type SubmissionResultBase = {
    isCorrect: boolean;
    explanation: string;
};

export type McqSingleResult = SubmissionResultBase & {
    type: "mcq-single";
    correctOptionIds: string[];
};

export type McqMultiResult = SubmissionResultBase & {
    type: "mcq-multi";
    correctOptionIds: string[];
};

export type MultiTfResult = SubmissionResultBase & {
    type: "multi-tf";
    correctOptionIds: string[];
};

export type DragOrderResult = SubmissionResultBase & {
    type: "drag-order";
    correctOrder: string[];
};

export type MatchingResult = SubmissionResultBase & {
    type: "matching";
    correctPairs: Record<string, string>;
};

export type FillBlankResult = SubmissionResultBase & {
    type: "fill-blank";
    acceptedAnswers: string[];
};

export type SubmissionResult =
    | McqSingleResult
    | McqMultiResult
    | MultiTfResult
    | DragOrderResult
    | MatchingResult
    | FillBlankResult;
