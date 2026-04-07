from __future__ import annotations

import json

import httpx
from fastapi import HTTPException, status

from app.core.config import get_settings
from app.schemas import QuizGeneratorResponse


def _extract_text_payload(payload: dict) -> str:
    output_text = payload.get("output_text")
    if isinstance(output_text, str) and output_text.strip():
        return output_text.strip()

    for output in payload.get("output", []):
        for content in output.get("content", []):
            text = content.get("text")
            if isinstance(text, str) and text.strip():
                return text.strip()

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="OpenAI response did not contain any text output",
    )


async def generate_quiz(topic: str) -> QuizGeneratorResponse:
    settings = get_settings()

    if not settings.openai_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OPENAI_API_KEY is not configured",
        )

    schema = {
        "type": "object",
        "properties": {
            "topic": {"type": "string"},
            "questions": {
                "type": "array",
                "minItems": 10,
                "maxItems": 10,
                "items": {
                    "type": "object",
                    "properties": {
                        "question": {"type": "string"},
                        "options": {
                            "type": "array",
                            "minItems": 4,
                            "maxItems": 4,
                            "items": {"type": "string"},
                        },
                        "answer": {"type": "string"},
                    },
                    "required": ["question", "options", "answer"],
                    "additionalProperties": False,
                },
            },
        },
        "required": ["topic", "questions"],
        "additionalProperties": False,
    }

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            "https://api.openai.com/v1/responses",
            headers={
                "Authorization": f"Bearer {settings.openai_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.openai_model,
                "instructions": (
                    "You are EduFlow Quiz Generator. "
                    "Create exactly 10 multiple-choice questions for the given academic topic. "
                    "Each question must have 4 options and one correct answer. "
                    "Keep options plausible and educational."
                ),
                "input": f"Topic: {topic}",
                "text": {
                    "format": {
                        "type": "json_schema",
                        "name": "quiz_generator_response",
                        "schema": schema,
                        "strict": True,
                    }
                },
            },
        )

    if response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenAI request failed with status {response.status_code}",
        )

    raw_text = _extract_text_payload(response.json())

    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="OpenAI returned invalid JSON for quiz generator",
        ) from exc

    return QuizGeneratorResponse(**data)
