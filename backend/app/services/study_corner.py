from __future__ import annotations

import json

import httpx
from fastapi import HTTPException, status

from app.core.config import get_settings
from app.schemas import StudyCornerResponse


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


async def generate_study_corner(topic: str) -> StudyCornerResponse:
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
            "easy_explanation": {"type": "string"},
            "real_life_analogy": {"type": "string"},
            "important_questions": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 3,
                "maxItems": 5,
            },
        },
        "required": [
            "topic",
            "easy_explanation",
            "real_life_analogy",
            "important_questions",
        ],
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
                    "You are EduFlow Study Corner, an expert academic tutor. "
                    "Teach in simple language suitable for students. "
                    "Keep the explanation concise but useful."
                ),
                "input": f"Topic: {topic}",
                "text": {
                    "format": {
                        "type": "json_schema",
                        "name": "study_corner_response",
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
            detail="OpenAI returned invalid JSON for Study Corner",
        ) from exc

    return StudyCornerResponse(**data)
