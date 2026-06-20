from typing import Annotated, Literal
from pydantic import BaseModel, Field

class Quiz(BaseModel):
    slug: str
    name: str
    description: str
    track_slug: str
    kind: str
    subkind: str
    bank: str
    time_limit_minutes: int | None = None

class CatalogDrill(BaseModel):
    slug: str
    name: str
    description: str
    href: str
    quiz_slug: str | None = None
    item_count: int | None = None

class CatalogCategoryListResponse(BaseModel):
    categories: list[str]

class CatalogCategoryPreviewResponse(BaseModel):
    category_slug: str
    items: list[CatalogDrill]

class CatalogDrillListResponse(BaseModel):
    category_slug: str
    drills: list[CatalogDrill]

class QuestionOption(BaseModel):
    id: str
    text: str

class Premise(BaseModel):
    id: str
    text: str

class Exhibit(BaseModel):
    type: str
    content: str

class BaseQuestion(BaseModel):
    id: str
    topic_id: str
    sub_topic_id: str
    question_type: str
    stem: str
    exhibit: Exhibit | None = None
    options: list[QuestionOption]

class McqSingleQuestion(BaseQuestion):
    question_type: Literal["mcq-single"] = "mcq-single"

class McqMultiQuestion(BaseQuestion):
    question_type: Literal["mcq-multi"] = "mcq-multi"
    select_count: int

class DragOrderQuestion(BaseQuestion):
    question_type: Literal["drag-order"] = "drag-order"

class MatchingQuestion(BaseQuestion):
    question_type: Literal["matching"] = "matching"
    premises: list[Premise]

class MultiTfQuestion(BaseQuestion):
    question_type: Literal["multi-tf"] = "multi-tf"

class FillBlankQuestion(BaseQuestion):
    question_type: Literal["fill-blank"] = "fill-blank"

QuizQuestion = Annotated[
    McqSingleQuestion
    | McqMultiQuestion
    | DragOrderQuestion
    | MatchingQuestion
    | MultiTfQuestion
    | FillBlankQuestion,
    Field(discriminator="question_type"),
]

class McqSingleAnswer(BaseModel):
    type: Literal["mcq-single"] = "mcq-single"
    answer: str

class McqMultiAnswer(BaseModel):
    type: Literal["mcq-multi"] = "mcq-multi"
    answer: list[str]

class DragOrderAnswer(BaseModel):
    type: Literal["drag-order"] = "drag-order"
    answer: dict[str, str]

class MatchingAnswer(BaseModel):
    type: Literal["matching"] = "matching"
    answer: dict[str, str]

class MultiTfAnswer(BaseModel):
    type: Literal["multi-tf"] = "multi-tf"
    answer: list[str]

class FillBlankAnswer(BaseModel):
    type: Literal["fill-blank"] = "fill-blank"
    answer: str

AnswerRequest = Annotated[
    McqSingleAnswer
    | McqMultiAnswer
    | DragOrderAnswer
    | MatchingAnswer
    | MultiTfAnswer
    | FillBlankAnswer,
    Field(discriminator="type"),
]

class SubmissionResultBase(BaseModel):
    isCorrect: bool
    explanation: str

class OptionsResult(SubmissionResultBase):
    type: Literal["mcq-single", "mcq-multi", "multi-tf"]
    correctOptionIds: list[str]

class PairsResult(SubmissionResultBase):
    type: Literal["drag-order", "matching"]
    correctPairs: dict[str, str]

class FillBlankResult(SubmissionResultBase):
    type: Literal["fill-blank"]
    acceptedAnswers: list[str]

SubmissionResult = Annotated[
    OptionsResult | PairsResult | FillBlankResult,
    Field(discriminator="type"),
]
