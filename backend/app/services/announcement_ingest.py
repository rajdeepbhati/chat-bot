from __future__ import annotations

import re
from datetime import date, datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import CampusAnnouncement, CampusDay


MONTH_NAME_PATTERN = (
    r"(january|february|march|april|may|june|july|august|september|october|november|december)"
)


def parse_announcement_date(text: str, today: date | None = None) -> date:
    today = today or date.today()

    iso_match = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", text, re.IGNORECASE)
    if iso_match:
        return datetime.strptime(iso_match.group(1), "%Y-%m-%d").date()

    named_match = re.search(
        rf"\b{MONTH_NAME_PATTERN}\s+(\d{{1,2}})(?:,\s*(\d{{4}}))?\b",
        text,
        re.IGNORECASE,
    )
    if named_match:
        month_name = named_match.group(1)
        day_value = int(named_match.group(2))
        year_value = int(named_match.group(3)) if named_match.group(3) else today.year
        return datetime.strptime(f"{month_name} {day_value} {year_value}", "%B %d %Y").date()

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Could not detect a date in the announcement text",
    )


def ingest_admin_announcement(text: str, db: Session, audience: str = "All") -> dict:
    normalized = " ".join(text.split()).strip()
    if not normalized:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Announcement text is required",
        )

    target_date = parse_announcement_date(normalized)
    lowered = normalized.lower()

    if "closed" in lowered:
        is_open = False
        title = f"Campus closed on {target_date.isoformat()}"
        reason = "Closure announcement"
    elif "open" in lowered:
        is_open = True
        title = f"Campus open on {target_date.isoformat()}"
        reason = "Open day announcement"
    else:
        is_open = True
        title = f"Campus announcement for {target_date.isoformat()}"
        reason = "General announcement"

    campus_day = db.query(CampusDay).filter(CampusDay.day == target_date).first()
    if campus_day is None:
        campus_day = CampusDay(
            day=target_date,
            is_open=is_open,
            title=title,
            reason=reason,
            notes=normalized,
        )
        db.add(campus_day)
    else:
        campus_day.is_open = is_open
        campus_day.title = title
        campus_day.reason = reason
        campus_day.notes = normalized

    announcement = CampusAnnouncement(
        title=title,
        message=normalized,
        audience=audience,
        effective_from=target_date,
        effective_to=target_date,
    )
    db.add(announcement)
    db.commit()
    db.refresh(campus_day)
    db.refresh(announcement)

    return {
        "announcement_id": announcement.id,
        "campus_day_id": campus_day.id,
        "stored_date": target_date.isoformat(),
        "is_open": campus_day.is_open,
        "title": announcement.title,
        "message": announcement.message,
    }
