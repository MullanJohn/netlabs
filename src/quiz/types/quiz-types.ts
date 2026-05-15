export type QuizQuestion =
    | McqSingleQuestion
    | McqMultiQuestion
    | DragDropQuestion;

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

    question_type: "mcq-single" | "mcq-multi" | "drag-drop";
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

export type DragDropQuestion = BaseQuestion & {
    question_type: "drag-drop";
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

type QuizAnswer =
    | { type: "single"; optionId: string | null }
    | { type: "multi"; optionIds: string[] }
    | { type: "dragDrop"; pairs: Partial<Record<string, string>> };

export type QuizAnswers = Record<string, QuizAnswer>;
