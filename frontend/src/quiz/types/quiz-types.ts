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

export type Exhibit =
    | {
          type: "config-snippet";
          content: string;
      }
    | {
          type: "show-output";
          content: string;
      }
    | {
          type: "text";
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
    | { type: "drag-order"; answer: Record<string, string> }
    | { type: "matching"; answer: Record<string, string> }
    | { type: "multi-tf"; answer: string[] }
    | { type: "fill-blank"; answer: string };

type SubmissionResultBase = {
    isCorrect: boolean;
    explanation: string;
};

export type SubmissionResult =
    | (SubmissionResultBase & {
          type: "mcq-single" | "mcq-multi" | "multi-tf";
          correctOptionIds: string[];
      })
    | (SubmissionResultBase & {
          type: "drag-order" | "matching";
          correctPairs: Record<string, string>;
      })
    | (SubmissionResultBase & {
          type: "fill-blank";
          acceptedAnswers: string[];
      });
