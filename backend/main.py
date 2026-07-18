from contextlib import asynccontextmanager
import json
import logging
import os
import sys
from typing import Any, assert_never

import asyncpg
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from models import (
    AnswerRequest,
    DragOrderAnswer,
    DragOrderResult,
    FillBlankAnswer,
    FillBlankKey,
    FillBlankResult,
    MatchingAnswer,
    MatchingKey,
    MatchingResult,
    McqMultiAnswer,
    McqMultiResult,
    McqSingleAnswer,
    McqSingleResult,
    MultiTfAnswer,
    MultiTfResult,
    OptionsKey,
    SubmissionResult,
)

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    stream=sys.stdout,
)

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Creating database connection pool")
    app.state.pool = await asyncpg.create_pool(
        DATABASE_URL,
        min_size=1,
        max_size=10,
    )
    try:
        yield
    finally:
        logger.info("Closing database connection pool")
        await app.state.pool.close()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv("CORS_ALLOW_ORIGINS", "*").split(",")
        if origin.strip()
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_conn(request: Request):
    async with request.app.state.pool.acquire() as conn:
        yield conn

def decode_json(value: Any) -> Any:
    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            logger.warning("Failed to decode JSON value")
            return value
    return value

def grade_submission(
    submission: AnswerRequest,
    key_json: Any,
    explanation: str,
) -> SubmissionResult:
    match submission:
        case McqSingleAnswer():
            key = OptionsKey.model_validate(key_json)
            return McqSingleResult(
                isCorrect=submission.answer == key.correct[0],
                correctOptionIds=key.correct,
                explanation=explanation,
            )
        case McqMultiAnswer():
            key = OptionsKey.model_validate(key_json)
            return McqMultiResult(
                isCorrect=frozenset(submission.answer) == frozenset(key.correct),
                correctOptionIds=key.correct,
                explanation=explanation,
            )
        case MultiTfAnswer():
            key = OptionsKey.model_validate(key_json)
            return MultiTfResult(
                isCorrect=frozenset(submission.answer) == frozenset(key.correct),
                correctOptionIds=key.correct,
                explanation=explanation,
            )
        case DragOrderAnswer():
            key = OptionsKey.model_validate(key_json)
            if len(submission.answer) != len(key.correct):
                raise HTTPException(
                    status_code=400,
                    detail="Answer must order exactly the question's options",
                )
            return DragOrderResult(
                isCorrect=submission.answer == key.correct,
                correctOrder=key.correct,
                explanation=explanation,
            )
        case MatchingAnswer():
            key = MatchingKey.model_validate(key_json)
            correct_pairs = string_map(key.correct)
            return MatchingResult(
                isCorrect=string_map(submission.answer) == correct_pairs,
                correctPairs=correct_pairs,
                explanation=explanation,
            )
        case FillBlankAnswer():
            key = FillBlankKey.model_validate(key_json)
            return FillBlankResult(
                isCorrect=normalize_text_answer(submission.answer)
                in {normalize_text_answer(a) for a in key.accepted},
                acceptedAnswers=key.accepted,
                explanation=explanation,
            )
        case _:
            assert_never(submission)

def grade_answer_row(
    submission: AnswerRequest,
    row: asyncpg.Record,
    context: str,
) -> SubmissionResult:
    if submission.type != row["question_type"]:
        logger.warning(
            "Answer type mismatch: %s expected=%s received=%s",
            context,
            row["question_type"],
            submission.type,
        )
        raise HTTPException(
            status_code=400,
            detail="Answer type does not match question type",
        )
    try:
        return grade_submission(
            submission,
            decode_json(row["answer"]),
            row["rationale"],
        )
    except ValidationError as e:
        logger.error("Malformed answer key: %s error=%s", context, e)
        raise HTTPException(
            status_code=500,
            detail="Malformed question data",
        ) from e

def string_map(mapping: dict[Any, Any]) -> dict[str, str]:
    return {str(key): str(value) for key, value in mapping.items()}

def normalize_text_answer(value: str) -> str:
    return " ".join(value.split()).casefold()

@app.post("/questions/{question_id}/answer", response_model=SubmissionResult)
async def submit_standalone_answer(
    question_id: str,
    submission: AnswerRequest,
    conn: asyncpg.Connection = Depends(get_conn),
):
    try:
        row = await conn.fetchrow(
            """
            SELECT q.question_type, q.answer, q.rationale
            FROM questions q
            WHERE q.id = $1
            """,
            question_id,
        )
        if row is None:
            logger.warning("Question not found: question_id=%s", question_id)
            raise HTTPException(status_code=404, detail="Question not found")
        result = grade_answer_row(
            submission,
            row,
            f"question_id={question_id}",
        )
        logger.info(
            "Submitted standalone answer: question_id=%s type=%s is_correct=%s",
            question_id,
            submission.type,
            result.isCorrect,
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(
            "Failed to submit standalone answer: question_id=%s",
            question_id,
        )
        raise HTTPException(status_code=500, detail="Internal server error") from e

@app.post(
    "/quizzes/{quiz_slug}/questions/{question_id}/answer",
    response_model=SubmissionResult,
)
async def submit_answer(
    quiz_slug: str,
    question_id: str,
    submission: AnswerRequest,
    conn: asyncpg.Connection = Depends(get_conn),
):
    try:
        row = await conn.fetchrow(
            """
            SELECT q.question_type, q.answer, q.rationale
            FROM questions q
            JOIN quiz_template_items qti ON qti.question_id = q.id
            WHERE q.id = $1
              AND qti.template_slug = $2
            """,
            question_id,
            quiz_slug,
        )
        if row is None:
            logger.warning(
                "Question not found in quiz: quiz_slug=%s question_id=%s",
                quiz_slug,
                question_id,
            )
            raise HTTPException(status_code=404, detail="Question not found in quiz")
        result = grade_answer_row(
            submission,
            row,
            f"quiz_slug={quiz_slug} question_id={question_id}",
        )
        logger.info(
            "Submitted answer: quiz_slug=%s question_id=%s type=%s is_correct=%s",
            quiz_slug,
            question_id,
            submission.type,
            result.isCorrect,
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(
            "Failed to submit answer: quiz_slug=%s question_id=%s",
            quiz_slug,
            question_id,
        )
        raise HTTPException(status_code=500, detail="Internal server error") from e
