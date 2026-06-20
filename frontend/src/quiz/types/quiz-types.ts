export type QuizQuestion =
    | McqSingleQuestion
    | McqMultiQuestion
    | DragOrderQuestion;

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

    question_type: "mcq-single" | "mcq-multi" | "drag-order";
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

export type QuestionOption = {
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
    | { type: "drag-order"; pairs: Partial<Record<string, string>> };

export type QuizAnswers = Record<string, QuizAnswer>;

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
