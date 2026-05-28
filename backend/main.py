from contextlib import asynccontextmanager
import json
import logging
import os
import sys
from typing import Any

import asyncpg
from fastapi import Depends, FastAPI, HTTPException, Request

from models import (
    AnswerRequest,
    CatalogCategoryListResponse,
    CatalogCategoryPreviewResponse,
    CatalogDrillListResponse,
    Quiz,
    QuizQuestion,
    SubmitAnswerResponse,
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

def decode_correct_answer(value: Any) -> list[str]:
    decoded = decode_json(value)
    return [str(option_id) for option_id in decoded]

def question_from_row(row: asyncpg.Record | None) -> dict[str, Any] | None:
    if row is None:
        return None
    data = dict(row)
    data["options"] = decode_json(data.get("options")) or []
    data["exhibit"] = decode_json(data.get("exhibit"))
    return data

def catalog_drill(row: asyncpg.Record) -> dict[str, Any]:
    return {
        "slug": row["slug"],
        "name": row["name"],
        "description": row["description"],
        "href": f"/quiz/{row['slug']}",
        "quiz_slug": row["slug"],
        "item_count": row["item_count"],
    }

async def fetch_first_question(
    quiz_slug: str,
    conn: asyncpg.Connection,
) -> dict[str, Any] | None:
    row = await conn.fetchrow(
        f"""
        {QUESTION_ROW_SELECT}
        JOIN (
            SELECT question_id, position
            FROM quiz_template_items
            WHERE template_slug = $1
            ORDER BY position
            LIMIT 1
        ) qti ON qti.question_id = q.id
        {QUESTION_ROW_GROUP_BY},
            qti.position
        ORDER BY qti.position
        """,
        quiz_slug,
    )
    return question_from_row(row)

async def fetch_next_question(
    quiz_slug: str,
    question_id: str,
    conn: asyncpg.Connection,
) -> dict[str, Any] | None:
    row = await conn.fetchrow(
        f"""
        {QUESTION_ROW_SELECT}
        JOIN (
            SELECT question_id, position
            FROM quiz_template_items
            WHERE template_slug = $1
              AND position > (
                  SELECT position
                  FROM quiz_template_items
                  WHERE template_slug = $1
                    AND question_id = $2
              )
            ORDER BY position
            LIMIT 1
        ) qti ON qti.question_id = q.id
        {QUESTION_ROW_GROUP_BY},
            qti.position
        ORDER BY qti.position
        """,
        quiz_slug,
        question_id,
    )
    return question_from_row(row)

def check_answer(
    answer: AnswerRequest,
    correct_answer: list[str],
) -> bool:
    logger.debug("Checking answer type=%s", answer.type)
    match answer.type:
        case "mcq-single":
            return check_answer_single(answer, correct_answer)
        case "mcq-multi":
            return check_answer_multi(answer, correct_answer)
        case "drag-drop":
            return check_answer_drag_drop(answer, correct_answer)
        case _:
            logger.warning("Unsupported answer type: %s", answer.type)
            return False

def check_answer_single(
    answer: AnswerRequest,
    correct_answer: list[str],
) -> bool:
    return answer.optionId == correct_answer[0]

def check_answer_multi(
    answer: AnswerRequest,
    correct_answer: list[str],
) -> bool:
    return frozenset(answer.optionIds or []) == frozenset(correct_answer)

def correct_drag_drop_pairs(correct_answer: list[str]) -> dict[str, str]:
    return {
        f"answer-{position}": option_id
        for position, option_id in enumerate(correct_answer)
    }

def check_answer_drag_drop(
    answer: AnswerRequest,
    correct_answer: list[str],
) -> bool:
    return (answer.pairs or {}) == correct_drag_drop_pairs(correct_answer)

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

@app.get("/{quiz_slug}/start", response_model=QuizQuestion)
async def start_quiz(
    quiz_slug: str,
    conn: asyncpg.Connection = Depends(get_conn),
):
    try:
        question = await fetch_first_question(quiz_slug, conn)
        if question is None:
            logger.warning("Quiz not found: quiz_slug=%s", quiz_slug)
            raise HTTPException(status_code=404, detail="Quiz not found")
        logger.info("Started quiz: quiz_slug=%s first_question_id=%s", quiz_slug, question["id"])
        return question
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to start quiz: quiz_slug=%s", quiz_slug)
        raise HTTPException(status_code=500, detail="Internal server error") from e

@app.post(
    "/{quiz_slug}/{question_id}/answer",
    response_model=SubmitAnswerResponse,
)
async def submit_answer(
    quiz_slug: str,
    question_id: str,
    answer: AnswerRequest,
    conn: asyncpg.Connection = Depends(get_conn),
):
    try:
        row = await conn.fetchrow(
            """
            SELECT q.question_type, q.answer_correct, q.rationale
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
        if answer.type != expected_answer_type:
            logger.warning(
                "Answer type mismatch: quiz_slug=%s question_id=%s expected=%s received=%s",
                quiz_slug,
                question_id,
                expected_answer_type,
                answer.type,
            )
            raise HTTPException(
                status_code=400,
                detail="Answer type does not match question type",
            )
        correct_answer = decode_correct_answer(row["answer_correct"])
        is_correct = check_answer(answer, correct_answer)
        next_q = await fetch_next_question(quiz_slug, question_id, conn)
        result_data: dict[str, Any] = {
            "isCorrect": is_correct,
            "explanation": row["rationale"],
        }
        if answer.type == "drag-drop":
            result_data["correctPairs"] = correct_drag_drop_pairs(correct_answer)
        elif answer.type in {"mcq-single", "mcq-multi"}:
            result_data["correctOptionIds"] = correct_answer
        logger.info(
            "Submitted answer: quiz_slug=%s question_id=%s type=%s is_correct=%s",
            quiz_slug,
            question_id,
            answer.type,
            is_correct,
        )
        return {
            "result": result_data,
            "nextQuestion": next_q,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(
            "Failed to submit answer: quiz_slug=%s question_id=%s",
            quiz_slug,
            question_id,
        )
        raise HTTPException(status_code=500, detail="Internal server error") from e
