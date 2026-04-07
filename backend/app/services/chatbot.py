from __future__ import annotations

import re
from datetime import date, datetime, timedelta

import httpx
from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import CampusAnnouncement, CampusDay


def resolve_target_date(question: str, today: date | None = None) -> date | None:
    today = today or date.today()
    lowered = question.lower()

    if "tomorrow" in lowered:
        return today + timedelta(days=1)
    if "today" in lowered:
        return today
    if "yesterday" in lowered:
        return today - timedelta(days=1)

    iso_match = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", question)
    if iso_match:
        return datetime.strptime(iso_match.group(1), "%Y-%m-%d").date()

    named_match = re.search(
        r"\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:,\s*(\d{4}))?\b",
        question,
        re.IGNORECASE,
    )
    if named_match:
        month_name = named_match.group(1)
        day_value = int(named_match.group(2))
        year_value = int(named_match.group(3)) if named_match.group(3) else today.year
        return datetime.strptime(f"{month_name} {day_value} {year_value}", "%B %d %Y").date()

    return None


def fetch_grounding_context(db: Session, question: str) -> tuple[list[str], date | None]:
    target_date = resolve_target_date(question)
    context_lines: list[str] = []

    if target_date is not None:
        campus_day = db.query(CampusDay).filter(CampusDay.day == target_date).first()
        if campus_day:
            status_text = "open" if campus_day.is_open else "closed"
            context_lines.append(
                f"Campus status for {target_date.isoformat()}: {status_text}. Title: {campus_day.title}."
            )
            if campus_day.reason:
                context_lines.append(f"Reason: {campus_day.reason}.")
            if campus_day.notes:
                context_lines.append(f"Notes: {campus_day.notes}")
        else:
            context_lines.append(
                f"No explicit campus-day record was found for {target_date.isoformat()} in the SQL database."
            )

        announcements = (
            db.query(CampusAnnouncement)
            .filter(
                CampusAnnouncement.effective_from <= target_date,
                or_(CampusAnnouncement.effective_to.is_(None), CampusAnnouncement.effective_to >= target_date),
            )
            .order_by(CampusAnnouncement.created_at.desc())
            .all()
        )
    else:
        announcements = (
            db.query(CampusAnnouncement)
            .order_by(CampusAnnouncement.created_at.desc())
            .limit(5)
            .all()
        )

    if announcements:
        context_lines.append("Relevant announcements from the SQL database:")
        for announcement in announcements:
            context_lines.append(
                f"- {announcement.title} ({announcement.audience}): {announcement.message}"
            )

    return context_lines, target_date


def build_prompt(question: str, context_lines: list[str]) -> str:
    context_block = "\n".join(context_lines) if context_lines else "No matching SQL data was found."
    return (
        "You are EduFlow Campus Assistant. Answer only from the provided campus database facts.\n"
        "If the SQL facts are insufficient, clearly say what is missing instead of guessing.\n"
        "Keep the reply natural, concise, and helpful.\n\n"
        f"Campus database facts:\n{context_block}\n\n"
        f"User question: {question}"
    )


async def call_openai(prompt: str) -> str:
    settings = get_settings()
    if not settings.openai_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OPENAI_API_KEY is not configured",
        )

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            "https://api.openai.com/v1/responses",
            headers={
                "Authorization": f"Bearer {settings.openai_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.openai_model,
                "input": prompt,
            },
        )

    if response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenAI request failed with status {response.status_code}",
        )

    payload = response.json()
    if isinstance(payload.get("output_text"), str) and payload["output_text"].strip():
        return payload["output_text"].strip()

    for output in payload.get("output", []):
        for content in output.get("content", []):
            text = content.get("text")
            if isinstance(text, str) and text.strip():
                return text.strip()

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="OpenAI response did not contain any text output",
    )


async def call_gemini(prompt: str) -> str:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GEMINI_API_KEY is not configured",
        )

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent"
        f"?key={settings.gemini_api_key}"
    )

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            url,
            headers={"Content-Type": "application/json"},
            json={
                "contents": [
                    {
                        "parts": [{"text": prompt}],
                    }
                ]
            },
        )

    if response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini request failed with status {response.status_code}",
        )

    payload = response.json()
    for candidate in payload.get("candidates", []):
        content = candidate.get("content", {})
        for part in content.get("parts", []):
            text = part.get("text")
            if isinstance(text, str) and text.strip():
                return text.strip()

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="Gemini response did not contain any text output",
    )


async def generate_grounded_answer(question: str, db: Session, provider_override: str | None = None) -> tuple[str, str, list[str], date | None]:
    settings = get_settings()
    provider = (provider_override or settings.ai_provider).lower()
    context_lines, target_date = fetch_grounding_context(db, question)
    prompt = build_prompt(question, context_lines)

    if provider == "openai":
        answer = await call_openai(prompt)
    elif provider == "gemini":
        answer = await call_gemini(prompt)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provider must be either 'openai' or 'gemini'",
        )

    return answer, provider, context_lines, target_date
