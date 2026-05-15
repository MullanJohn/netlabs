from typing import Annotated, Literal
from pydantic import BaseModel, Field


class AnswerRequest(BaseModel):
    type: Literal["mcq-single", "mcq-multi", "drag-drop"]
    optionId: str | None = None
    optionIds: list[str] | None = None
    pairs: dict[str, str] | None = None

class QuestionOption(BaseModel):
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


class DragDropQuestion(BaseQuestion):
    question_type: Literal["drag-drop"] = "drag-drop"


QuizQuestion = Annotated[
    McqSingleQuestion | McqMultiQuestion | DragDropQuestion,
    Field(discriminator="question_type"),
]

class SubmissionResult(BaseModel):
    isCorrect: bool
    explanation: str
    correctOptionIds: list[str] | None = None
    correctPairs: dict[str, str] | None = None


class SubmitAnswerResponse(BaseModel):
    result: SubmissionResult
    nextQuestion: QuizQuestion | None = None


class Quiz(BaseModel):
    slug: str
    name: str
    kind: str
    bank: str
    time_limit_minutes: int
