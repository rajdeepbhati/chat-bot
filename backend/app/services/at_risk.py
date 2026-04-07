from __future__ import annotations

import asyncio

import httpx
from fastapi import HTTPException, status

from app.core.config import get_settings


def detect_at_risk_students(
    students: list[dict],
    attendance_threshold: float = 75.0,
    marks_threshold: float = 60.0,
) -> list[dict]:
    at_risk: list[dict] = []

    for student in students:
        attendance = float(student.get("attendance_percentage") or 0)
        latest_mark = student.get("latest_mark")
        mark_value = float(latest_mark) if latest_mark is not None else 0.0

        reasons: list[str] = []
        if attendance < attendance_threshold:
            reasons.append(f"attendance is below {attendance_threshold}%")
        if latest_mark is None or mark_value < marks_threshold:
            reasons.append(f"marks are below {marks_threshold}")

        if reasons:
            at_risk.append(
                {
                    "student_id": student["id"],
                    "student_name": student["name"],
                    "enrollment_no": student["enrollment_no"],
                    "attendance_percentage": attendance,
                    "latest_mark": latest_mark,
                    "risk_reasons": reasons,
                }
            )

    return at_risk


async def generate_feedback_message(student: dict) -> str:
    settings = get_settings()

    if not settings.openai_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OPENAI_API_KEY is not configured",
        )

    prompt = (
        "Write a short, supportive academic feedback message for a student identified as at risk. "
        "Be constructive, specific, and action-oriented in 2 to 3 sentences.\n\n"
        f"Student name: {student['student_name']}\n"
        f"Enrollment number: {student['enrollment_no']}\n"
        f"Attendance percentage: {student['attendance_percentage']}\n"
        f"Latest mark: {student['latest_mark']}\n"
        f"Risk reasons: {', '.join(student['risk_reasons'])}\n"
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


async def build_at_risk_report(students: list[dict]) -> list[dict]:
    at_risk_students = detect_at_risk_students(students)
    feedback_messages = await asyncio.gather(
        *(generate_feedback_message(student) for student in at_risk_students)
    )

    for student, feedback in zip(at_risk_students, feedback_messages, strict=False):
        student["feedback_message"] = feedback

    return at_risk_students
