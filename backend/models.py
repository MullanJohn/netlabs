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

class CatalogCategory(BaseModel):
    slug: str

class CatalogCategoryListResponse(BaseModel):
    categories: list[CatalogCategory]

class CatalogCategoryPreviewResponse(BaseModel):
    category_slug: str
    items: list[CatalogDrill]

class CatalogDrillListResponse(BaseModel):
    category_slug: str
    drills: list[CatalogDrill]

class BankQuestion(BaseModel):
    id: str
    topic_id: str
    sub_topic_id: str
    question_type: str
    stem: str

class BankQuestionListResponse(BaseModel):
    total: int
    questions: list[BankQuestion]

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
    answer: list[str]

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

class McqSingleResult(SubmissionResultBase):
    type: Literal["mcq-single"] = "mcq-single"
    correctOptionIds: list[str]

class McqMultiResult(SubmissionResultBase):
    type: Literal["mcq-multi"] = "mcq-multi"
    correctOptionIds: list[str]

class MultiTfResult(SubmissionResultBase):
    type: Literal["multi-tf"] = "multi-tf"
    correctOptionIds: list[str]

class DragOrderResult(SubmissionResultBase):
    type: Literal["drag-order"] = "drag-order"
    correctOrder: list[str]

class MatchingResult(SubmissionResultBase):
    type: Literal["matching"] = "matching"
    correctPairs: dict[str, str]

class FillBlankResult(SubmissionResultBase):
    type: Literal["fill-blank"] = "fill-blank"
    acceptedAnswers: list[str]

SubmissionResult = Annotated[
    McqSingleResult
    | McqMultiResult
    | MultiTfResult
    | DragOrderResult
    | MatchingResult
    | FillBlankResult,
    Field(discriminator="type"),
]

class OptionsKey(BaseModel):
    correct: list[str] = Field(min_length=1)

class MatchingKey(BaseModel):
    correct: dict[str, str]

class FillBlankKey(BaseModel):
    accepted: list[str] = Field(min_length=1)
