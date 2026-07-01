from contextlib import asynccontextmanager
import json
import logging
import os
import sys
from typing import Any, assert_never
from urllib.parse import quote

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
    CatalogCategoryListResponse,
    CatalogCategoryPreviewResponse,
    CatalogDrillListResponse,
    OptionsKey,
    Quiz,
    QuizQuestion,
    SubmissionResult,
)

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    stream=sys.stdout,
)

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")

QUESTION_ROW_SELECT = """
SELECT
    q.id,
    q.topic_id,
    q.sub_topic_id,
    q.question_type,
    q.select_count,
    q.premises,
    q.stem,
    CASE
        WHEN q.exhibit_type IS NULL THEN NULL
        ELSE jsonb_build_object('type', q.exhibit_type, 'content', q.exhibit_content)
    END AS exhibit,
    COALESCE(
        jsonb_agg(
            jsonb_build_object('id', qo.option_id, 'text', qo.text)
            ORDER BY qo.position
        ) FILTER (WHERE qo.option_id IS NOT NULL),
        '[]'::jsonb
    ) AS options
FROM questions q
LEFT JOIN question_options qo ON qo.question_id = q.id
"""

QUESTION_ROW_GROUP_BY = """
GROUP BY
    q.id,
    q.topic_id,
    q.sub_topic_id,
    q.question_type,
    q.select_count,
    q.premises,
    q.stem,
    q.exhibit_type,
    q.exhibit_content
"""

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

def catalog_drill(row: asyncpg.Record) -> dict[str, Any]:
    return {
        "slug": row["slug"],
        "name": row["name"],
        "description": row["description"],
        "href": f"/quiz?quiz={quote(row['slug'], safe='')}",
        "quiz_slug": row["slug"],
        "item_count": row["item_count"],
    }

def question_from_row(row: asyncpg.Record | None) -> dict[str, Any] | None:
    if row is None:
        return None
    data = dict(row)
    data["options"] = decode_json(data.get("options")) or []
    data["exhibit"] = decode_json(data.get("exhibit"))
    data["premises"] = decode_json(data.get("premises"))
    return data

async def fetch_quiz_questions(
    quiz_slug: str,
    conn: asyncpg.Connection,
) -> list[dict[str, Any]]:
    rows = await conn.fetch(
        f"""
        {QUESTION_ROW_SELECT}
        JOIN quiz_template_items qti ON qti.question_id = q.id
        WHERE qti.template_slug = $1
        {QUESTION_ROW_GROUP_BY},
            qti.position
        ORDER BY qti.position
        """,
        quiz_slug,
    )
    return [question_from_row(row) for row in rows]

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

def string_map(mapping: dict[Any, Any]) -> dict[str, str]:
    return {str(key): str(value) for key, value in mapping.items()}

def normalize_text_answer(value: str) -> str:
    return " ".join(value.split()).casefold()

@app.get("/quizzes", response_model=list[Quiz])
async def list_quizzes(conn: asyncpg.Connection = Depends(get_conn)):
    try:
        rows = await conn.fetch(
            """
            SELECT slug,
                   name,
                   description,
                   track_slug,
                   kind,
                   subkind,
                   bank,
                   time_limit_minutes
            FROM quiz_templates
            ORDER BY slug
            """
        )
        logger.info("Fetched %d quizzes", len(rows))
        return [dict(row) for row in rows]
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to list quizzes")
        raise HTTPException(status_code=500, detail="Internal server error") from e

@app.get(
    "/catalog/{track_slug}/categories",
    response_model=CatalogCategoryListResponse,
)
async def list_catalog_categories(
    track_slug: str,
    conn: asyncpg.Connection = Depends(get_conn),
):
    try:
        rows = await conn.fetch(
            f"""
            SELECT kind AS slug
            FROM quiz_templates qt
            WHERE qt.track_slug = $1
            GROUP BY kind
            ORDER BY kind
            """,
            track_slug,
        )
        categories = [dict(row) for row in rows]
        logger.info(
            "Fetched %d catalog categories: track_slug=%s",
            len(categories),
            track_slug,
        )
        return {"categories": categories}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to list catalog categories: track_slug=%s", track_slug)
        raise HTTPException(status_code=500, detail="Internal server error") from e

@app.get(
    "/catalog/{track_slug}/categories/{category_slug}/preview",
    response_model=CatalogCategoryPreviewResponse,
)
async def preview_catalog_drills(
    track_slug: str,
    category_slug: str,
    conn: asyncpg.Connection = Depends(get_conn),
):
    try:
        rows = await conn.fetch(
            f"""
            SELECT qt.slug,
                   qt.name,
                   qt.description,
                   COUNT(qti.question_id)::int AS item_count
            FROM quiz_templates qt
            LEFT JOIN quiz_template_items qti ON qti.template_slug = qt.slug
            WHERE qt.track_slug = $1
              AND qt.kind = $2
            GROUP BY qt.slug, qt.name, qt.description
            ORDER BY qt.slug
            LIMIT 3
            """,
            track_slug,
            category_slug,
        )
        return {
            "category_slug": category_slug,
            "items": [catalog_drill(row) for row in rows],
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(
            "Failed to preview catalog drills: track_slug=%s category_slug=%s",
            track_slug,
            category_slug,
        )
        raise HTTPException(status_code=500, detail="Internal server error") from e

@app.get(
    "/catalog/{track_slug}/categories/{category_slug}/drills",
    response_model=CatalogDrillListResponse,
)
async def list_catalog_drills(
    track_slug: str,
    category_slug: str,
    conn: asyncpg.Connection = Depends(get_conn),
):
    try:
        rows = await conn.fetch(
            f"""
            SELECT qt.slug,
                   qt.name,
                   qt.description,
                   COUNT(qti.question_id)::int AS item_count
            FROM quiz_templates qt
            LEFT JOIN quiz_template_items qti ON qti.template_slug = qt.slug
            WHERE qt.track_slug = $1
              AND qt.kind = $2
            GROUP BY qt.slug, qt.name, qt.description
            ORDER BY qt.slug
            """,
            track_slug,
            category_slug,
        )
        return {
            "category_slug": category_slug,
            "drills": [catalog_drill(row) for row in rows],
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(
            "Failed to list catalog drills: track_slug=%s category_slug=%s",
            track_slug,
            category_slug,
        )
        raise HTTPException(status_code=500, detail="Internal server error") from e

@app.get("/quizzes/{quiz_slug}/questions", response_model=list[QuizQuestion])
async def list_quiz_questions(
    quiz_slug: str,
    conn: asyncpg.Connection = Depends(get_conn),
):
    try:
        questions = await fetch_quiz_questions(quiz_slug, conn)
        if not questions:
            logger.warning("Quiz not found: quiz_slug=%s", quiz_slug)
            raise HTTPException(status_code=404, detail="Quiz not found")
        logger.info("Listed quiz questions: quiz_slug=%s count=%d", quiz_slug, len(questions))
        return questions
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to list quiz questions: quiz_slug=%s", quiz_slug)
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
        expected_answer_type = row["question_type"]
        if submission.type != expected_answer_type:
            logger.warning(
                "Answer type mismatch: quiz_slug=%s question_id=%s expected=%s received=%s",
                quiz_slug,
                question_id,
                expected_answer_type,
                submission.type,
            )
            raise HTTPException(
                status_code=400,
                detail="Answer type does not match question type",
            )
        try:
            result = grade_submission(
                submission,
                decode_json(row["answer"]),
                row["rationale"],
            )
        except ValidationError as e:
            logger.error(
                "Malformed answer key: quiz_slug=%s question_id=%s error=%s",
                quiz_slug,
                question_id,
                e,
            )
            raise HTTPException(
                status_code=500,
                detail="Malformed question data",
            ) from e
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
