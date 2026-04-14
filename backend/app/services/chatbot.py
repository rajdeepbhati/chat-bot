import re
from difflib import SequenceMatcher
from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from app.state.admin_store import ANNOUNCEMENTS


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


def normalize_text(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def find_announcement_match(question: str) -> dict | None:
    normalized_question = normalize_text(question)
    if not normalized_question:
        return None

    best_match: dict | None = None
    best_score = 0.0
    question_words = set(normalized_question.split())

    for announcement in ANNOUNCEMENTS:
        stored_question = normalize_text(announcement["title"])
        if not stored_question:
            continue

        if normalized_question == stored_question:
            return announcement

        similarity = SequenceMatcher(None, normalized_question, stored_question).ratio()
        stored_words = set(stored_question.split())
        overlap = len(question_words & stored_words) / max(len(stored_words), 1)
        score = max(similarity, overlap)

        if normalized_question in stored_question or stored_question in normalized_question:
            score = max(score, 0.9)

        if score > best_score:
            best_score = score
            best_match = announcement

    if best_score >= 0.72:
        return best_match

    return None


async def generate_grounded_answer(
    question: str,
    db: Session,
    provider_override: str | None = None,
) -> tuple[str, str, list[str], date | None]:
    del db, provider_override

    match = find_announcement_match(question)
    if match is None:
        return "Reply not found", "announcements", [], None

    return match["message"], "announcements", [match["title"]], None
