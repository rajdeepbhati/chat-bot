from __future__ import annotations

import json
import re
from datetime import date, datetime

import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import CampusEvent
from app.schemas import EventDetails, EventIntakeResponse


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


def _parse_date_from_text(text: str, today: date | None = None) -> str | None:
    today = today or date.today()
    iso_match = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", text, re.IGNORECASE)
    if iso_match:
        return iso_match.group(1)

    named_match = re.search(
        r"\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:,\s*(\d{4}))?\b",
        text,
        re.IGNORECASE,
    )
    if named_match:
        month_name = named_match.group(1)
        day_value = int(named_match.group(2))
        year_value = int(named_match.group(3)) if named_match.group(3) else today.year
        return datetime.strptime(f"{month_name} {day_value} {year_value}", "%B %d %Y").date().isoformat()

    return None


def fallback_event_analysis(text: str) -> EventIntakeResponse:
    parsed_date = _parse_date_from_text(text)
    lowered = text.lower()
    details = EventDetails(
        title=text.strip().split(" on ")[0].strip().title() if text.strip() else None,
        event_date=parsed_date,
        description=text.strip() or None,
    )

    follow_ups: list[str] = []
    if details.start_time is None:
        follow_ups.append("What is the event timing?")
    if details.location is None:
        follow_ups.append("What is the event location?")
    if details.dress_code is None:
        follow_ups.append("Is there any dress code for the event?")
    if details.event_date is None:
        follow_ups.append("On which date is the event scheduled?")
    if not details.title or details.title.lower() in {"college closed", "event"}:
        if "closed" not in lowered:
            follow_ups.append("What should be the event title?")

    return EventIntakeResponse(
        ready_to_store=len(follow_ups) == 0,
        event=details,
        follow_up_questions=follow_ups,
        stored_event_id=None,
    )


async def analyze_event_text(text: str) -> EventIntakeResponse:
    settings = get_settings()
    if not settings.openai_api_key:
      return fallback_event_analysis(text)

    schema = {
        "type": "object",
        "properties": {
            "ready_to_store": {"type": "boolean"},
            "event": {
                "type": "object",
                "properties": {
                    "title": {"type": ["string", "null"]},
                    "event_date": {"type": ["string", "null"]},
                    "start_time": {"type": ["string", "null"]},
                    "end_time": {"type": ["string", "null"]},
                    "location": {"type": ["string", "null"]},
                    "dress_code": {"type": ["string", "null"]},
                    "description": {"type": ["string", "null"]},
                },
                "required": [
                    "title",
                    "event_date",
                    "start_time",
                    "end_time",
                    "location",
                    "dress_code",
                    "description",
                ],
                "additionalProperties": False,
            },
            "follow_up_questions": {
                "type": "array",
                "items": {"type": "string"},
            },
        },
        "required": ["ready_to_store", "event", "follow_up_questions"],
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
                    "You are an event-intake assistant for a campus admin panel. "
                    "Extract structured event details from the admin's text. "
                    "If important event details are missing, ask focused follow-up questions, especially about timing, location, and dress code. "
                    "Set ready_to_store to true only when title, date, timing, and location are sufficiently clear."
                ),
                "input": f"Admin event draft: {text}",
                "text": {
                    "format": {
                        "type": "json_schema",
                        "name": "event_intake_response",
                        "schema": schema,
                        "strict": True,
                    }
                },
            },
        )

    if response.status_code >= 400:
        return fallback_event_analysis(text)

    raw_text = _extract_text_payload(response.json())
    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError:
        return fallback_event_analysis(text)

    return EventIntakeResponse(**data)


def store_event_if_ready(intake: EventIntakeResponse, db: Session) -> int | None:
    if not intake.ready_to_store:
        return None

    event_date = intake.event.event_date
    if not event_date or not intake.event.title or not intake.event.description:
        return None

    event = CampusEvent(
        title=intake.event.title,
        event_date=datetime.strptime(event_date, "%Y-%m-%d").date(),
        start_time=intake.event.start_time,
        end_time=intake.event.end_time,
        location=intake.event.location,
        dress_code=intake.event.dress_code,
        description=intake.event.description,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event.id
