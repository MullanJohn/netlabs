from typing import Annotated, Literal
from pydantic import BaseModel, Field

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
