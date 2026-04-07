import sys
from pathlib import Path

from fastapi.testclient import TestClient

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.main import app
from app.database import SessionLocal
from app.services.chatbot import fetch_grounding_context, resolve_target_date
from app.services.announcement_ingest import ingest_admin_announcement
from app.services.at_risk import detect_at_risk_students
from app.services.event_intake import fallback_event_analysis
from app.services.report_card import build_fallback_summary, generate_report_card_pdf


def main() -> None:
    with TestClient(app) as client:
        login_response = client.post(
            "/auth/login",
            json={"email": "admin@eduflow.ai", "password": "Admin@123"},
        )
        print("LOGIN", login_response.status_code, login_response.json())

        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        admin_response = client.get("/admin/panel", headers=headers)
        print("ADMIN", admin_response.status_code, admin_response.json())

        forbidden_response = client.get("/student/dashboard", headers=headers)
        print("STUDENT_WITH_ADMIN", forbidden_response.status_code, forbidden_response.json())

        student_login_response = client.post(
            "/auth/login",
            json={"email": "student@eduflow.ai", "password": "Student@123"},
        )
        print("STUDENT_LOGIN", student_login_response.status_code, student_login_response.json())

        student_token = student_login_response.json()["access_token"]
        student_headers = {"Authorization": f"Bearer {student_token}"}
        student_dashboard_response = client.get("/student/dashboard", headers=student_headers)
        print("STUDENT_DASHBOARD", student_dashboard_response.status_code, student_dashboard_response.json())

        faculty_login_response = client.post(
            "/auth/login",
            json={"email": "faculty@eduflow.ai", "password": "Faculty@123"},
        )
        print("FACULTY_LOGIN", faculty_login_response.status_code, faculty_login_response.json())

        faculty_token = faculty_login_response.json()["access_token"]
        faculty_headers = {"Authorization": f"Bearer {faculty_token}"}
        faculty_portal_response = client.get("/faculty/portal", headers=faculty_headers)
        print("FACULTY_PORTAL", faculty_portal_response.status_code, faculty_portal_response.json())

        attendance_response = client.post(
            "/faculty/attendance",
            headers=faculty_headers,
            json={
                "student_id": 101,
                "date": "2026-04-07",
                "subject": "Database Systems",
                "status": "present",
            },
        )
        print("FACULTY_ATTENDANCE", attendance_response.status_code, attendance_response.json())

        marks_response = client.post(
            "/faculty/marks",
            headers=faculty_headers,
            json={
                "student_id": 102,
                "subject": "Database Systems",
                "exam_type": "Internal Assessment",
                "score": 43,
                "max_score": 50,
            },
        )
        print("FACULTY_MARKS", marks_response.status_code, marks_response.json())

        admin_panel_response = client.get("/admin/panel", headers=headers)
        print("ADMIN_PANEL", admin_panel_response.status_code, admin_panel_response.json())

        admin_student_response = client.post(
            "/admin/students",
            headers=headers,
            json={
                "name": "Neha Kapoor",
                "email": "neha.kapoor@student.eduflow.ai",
                "enrollment_no": "2024CSE010",
                "course": "B.Tech CSE",
                "semester": 4,
            },
        )
        print("ADMIN_CREATE_STUDENT", admin_student_response.status_code, admin_student_response.json())

        admin_faculty_response = client.post(
            "/admin/faculty",
            headers=headers,
            json={
                "name": "Dr. Amit Joshi",
                "email": "amit.joshi@eduflow.ai",
                "department": "Computer Science",
                "designation": "Assistant Professor",
            },
        )
        print("ADMIN_CREATE_FACULTY", admin_faculty_response.status_code, admin_faculty_response.json())

        admin_announcement_response = client.post(
            "/admin/announcements",
            headers=headers,
            json={
                "title": "Portal Maintenance",
                "message": "The campus portal will be upgraded this Saturday evening.",
                "audience": "All",
            },
        )
        print("ADMIN_CREATE_ANNOUNCEMENT", admin_announcement_response.status_code, admin_announcement_response.json())

    db = SessionLocal()
    try:
        target_date = resolve_target_date("Is college open tomorrow?")
        context_lines, grounded_date = fetch_grounding_context(db, "Is college open tomorrow?")
        print("CHATBOT_TARGET_DATE", target_date.isoformat() if target_date else None)
        print("CHATBOT_GROUNDED_DATE", grounded_date.isoformat() if grounded_date else None)
        print("CHATBOT_CONTEXT", context_lines)
    finally:
        db.close()

    event_intake = fallback_event_analysis("Annual day on March 20")
    print("EVENT_INTAKE", event_intake.model_dump())

    db = SessionLocal()
    try:
        ingest_result = ingest_admin_announcement("College closed on March 20", db=db)
        context_lines, grounded_date = fetch_grounding_context(db, "Is college open on March 20?")
        print("INGEST_ANNOUNCEMENT", ingest_result)
        print("INGEST_CONTEXT_DATE", grounded_date.isoformat() if grounded_date else None)
        print("INGEST_CONTEXT", context_lines)
    finally:
        db.close()

    at_risk_report = detect_at_risk_students(
        [
            {
                "id": 201,
                "name": "Aman Gupta",
                "enrollment_no": "2024CSE020",
                "attendance_percentage": 68.0,
                "latest_mark": 54.0,
            },
            {
                "id": 202,
                "name": "Priya Shah",
                "enrollment_no": "2024CSE021",
                "attendance_percentage": 89.0,
                "latest_mark": 82.0,
            },
        ]
    )
    print("AT_RISK_LOGIC", at_risk_report)

    report_student = {
        "id": 301,
        "name": "Riya Patel",
        "enrollment_no": "2024CSE001",
        "semester": 4,
        "attendance_percentage": 91.2,
        "latest_mark": 91.0,
    }
    report_marks = [
        {"subject": "Database Systems", "exam_type": "Midterm", "score": 91.0, "max_score": 100.0},
        {"subject": "Operating Systems", "exam_type": "Quiz 1", "score": 18.0, "max_score": 20.0},
    ]
    report_summary = build_fallback_summary(report_student, report_marks)
    report_pdf = generate_report_card_pdf(report_student, report_marks, report_summary)
    print("REPORT_CARD_SUMMARY", report_summary)
    print("REPORT_CARD_BYTES", len(report_pdf))


if __name__ == "__main__":
    main()
