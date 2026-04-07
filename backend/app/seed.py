from datetime import date

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import CampusAnnouncement, CampusDay, User, UserRole


def seed_demo_users(db: Session) -> None:
    demo_users = [
        {
            "email": "admin@eduflow.ai",
            "full_name": "System Admin",
            "password": "Admin@123",
            "role": UserRole.admin,
        },
        {
            "email": "faculty@eduflow.ai",
            "full_name": "Faculty Demo",
            "password": "Faculty@123",
            "role": UserRole.faculty,
        },
        {
            "email": "student@eduflow.ai",
            "full_name": "Student Demo",
            "password": "Student@123",
            "role": UserRole.student,
        },
    ]

    for item in demo_users:
        existing_user = db.query(User).filter(User.email == item["email"]).first()
        if existing_user:
            continue

        db.add(
            User(
                email=item["email"],
                full_name=item["full_name"],
                password_hash=hash_password(item["password"]),
                role=item["role"],
                is_active=True,
            )
        )

    db.commit()


def seed_chatbot_data(db: Session) -> None:
    day_rows = [
        {
            "day": date(2026, 4, 7),
            "is_open": True,
            "title": "Regular academic day",
            "reason": None,
            "notes": "All lectures and labs will run as scheduled.",
        },
        {
            "day": date(2026, 4, 8),
            "is_open": False,
            "title": "Campus closed for Foundation Day",
            "reason": "Foundation Day holiday",
            "notes": "Administrative offices and classes remain closed tomorrow.",
        },
        {
            "day": date(2026, 4, 9),
            "is_open": True,
            "title": "Campus reopens",
            "reason": None,
            "notes": "Normal classes resume from 8:30 AM.",
        },
    ]

    for item in day_rows:
        existing_day = db.query(CampusDay).filter(CampusDay.day == item["day"]).first()
        if existing_day:
            continue
        db.add(CampusDay(**item))

    announcement_rows = [
        {
            "title": "Foundation Day Closure",
            "message": "The campus will remain closed on April 8, 2026 for Foundation Day celebrations.",
            "audience": "All",
            "effective_from": date(2026, 4, 7),
            "effective_to": date(2026, 4, 8),
        },
        {
            "title": "Database Lab Rescheduled",
            "message": "The Database Systems lab is moved to April 9, 2026 after the holiday closure.",
            "audience": "Students",
            "effective_from": date(2026, 4, 7),
            "effective_to": date(2026, 4, 9),
        },
    ]

    for item in announcement_rows:
        existing_announcement = (
            db.query(CampusAnnouncement)
            .filter(
                CampusAnnouncement.title == item["title"],
                CampusAnnouncement.effective_from == item["effective_from"],
            )
            .first()
        )
        if existing_announcement:
            continue
        db.add(CampusAnnouncement(**item))

    db.commit()
