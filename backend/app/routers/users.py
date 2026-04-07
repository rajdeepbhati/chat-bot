from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from io import BytesIO
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models import User, UserRole
from app.services.announcement_ingest import ingest_admin_announcement
from app.services.at_risk import build_at_risk_report
from app.services.event_intake import analyze_event_text, store_event_if_ready
from app.services.report_card import generate_performance_summary, generate_report_card_pdf
from app.schemas import (
    AdminFacultyRecord,
    AdminFacultyUpsertRequest,
    AdminPanelResponse,
    AdminStudentRecord,
    AdminStudentUpsertRequest,
    AnnouncementRecord,
    AnnouncementTextIngestRequest,
    AnnouncementTextIngestResponse,
    AnnouncementUpsertRequest,
    EventIntakeRequest,
    EventIntakeResponse,
    AtRiskStudentRecord,
    AtRiskStudentsResponse,
    AttendanceCreateRequest,
    AssignmentItem,
    AttendanceSummary,
    FacultyAttendanceRecord,
    FacultyMarkRecord,
    FacultyPortalResponse,
    FacultyStudentItem,
    MarkItem,
    MarkCreateRequest,
    MessageResponse,
    StudentDashboardResponse,
    TimetableItem,
    UserResponse,
)

router = APIRouter(tags=["Protected Endpoints"])

FACULTY_STUDENTS = [
    {
        "id": 101,
        "name": "Riya Patel",
        "enrollment_no": "2024CSE001",
        "semester": 4,
        "attendance_percentage": 91.2,
        "latest_mark": 91.0,
    },
    {
        "id": 102,
        "name": "Karan Mehta",
        "enrollment_no": "2024CSE002",
        "semester": 4,
        "attendance_percentage": 84.5,
        "latest_mark": 76.0,
    },
    {
        "id": 103,
        "name": "Sneha Iyer",
        "enrollment_no": "2024CSE003",
        "semester": 4,
        "attendance_percentage": 88.7,
        "latest_mark": 85.0,
    },
]

FACULTY_ATTENDANCE = [
    {
        "id": 1,
        "student_id": 101,
        "student_name": "Riya Patel",
        "date": "2026-04-07",
        "subject": "Database Systems",
        "status": "present",
    },
    {
        "id": 2,
        "student_id": 102,
        "student_name": "Karan Mehta",
        "date": "2026-04-07",
        "subject": "Database Systems",
        "status": "late",
    },
]

FACULTY_MARKS = [
    {
        "id": 1,
        "student_id": 101,
        "student_name": "Riya Patel",
        "subject": "Database Systems",
        "exam_type": "Midterm",
        "score": 91.0,
        "max_score": 100.0,
    },
    {
        "id": 2,
        "student_id": 101,
        "student_name": "Riya Patel",
        "subject": "Operating Systems",
        "exam_type": "Quiz 1",
        "score": 18.0,
        "max_score": 20.0,
    },
    {
        "id": 3,
        "student_id": 102,
        "student_name": "Karan Mehta",
        "subject": "Database Systems",
        "exam_type": "Midterm",
        "score": 58.0,
        "max_score": 100.0,
    },
    {
        "id": 4,
        "student_id": 102,
        "student_name": "Karan Mehta",
        "subject": "Operating Systems",
        "exam_type": "Quiz 1",
        "score": 14.0,
        "max_score": 20.0,
    },
    {
        "id": 5,
        "student_id": 103,
        "student_name": "Sneha Iyer",
        "subject": "Database Systems",
        "exam_type": "Quiz 2",
        "score": 18.0,
        "max_score": 20.0,
    },
    {
        "id": 6,
        "student_id": 103,
        "student_name": "Sneha Iyer",
        "subject": "Software Engineering",
        "exam_type": "Internal Assessment",
        "score": 44.0,
        "max_score": 50.0,
    },
]

ADMIN_STUDENTS = [
    {
        "id": 1,
        "name": "Riya Patel",
        "email": "riya.patel@student.eduflow.ai",
        "enrollment_no": "2024CSE001",
        "course": "B.Tech CSE",
        "semester": 4,
    },
    {
        "id": 2,
        "name": "Karan Mehta",
        "email": "karan.mehta@student.eduflow.ai",
        "enrollment_no": "2024CSE002",
        "course": "B.Tech CSE",
        "semester": 4,
    },
]

ADMIN_FACULTY = [
    {
        "id": 1,
        "name": "Dr. Meera Nair",
        "email": "meera.nair@eduflow.ai",
        "department": "Computer Science",
        "designation": "Professor",
    },
    {
        "id": 2,
        "name": "Prof. Arjun Singh",
        "email": "arjun.singh@eduflow.ai",
        "department": "Computer Science",
        "designation": "Associate Professor",
    },
]

ANNOUNCEMENTS = [
    {
        "id": 1,
        "title": "Mid-Semester Review",
        "message": "Academic review meeting will be held on Friday at 11 AM.",
        "audience": "All",
        "created_at": "2026-04-06",
    },
    {
        "id": 2,
        "title": "Database Lab Schedule",
        "message": "Lab timings for Database Systems have been updated in the portal.",
        "audience": "Students",
        "created_at": "2026-04-07",
    },
]


def _next_id(items: list[dict]) -> int:
    return max((item["id"] for item in items), default=0) + 1


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.get("/student/dashboard", response_model=StudentDashboardResponse)
def student_dashboard(
    current_user: User = Depends(require_roles(UserRole.student)),
) -> StudentDashboardResponse:
    return StudentDashboardResponse(
        student_name=current_user.full_name,
        today=date.today().isoformat(),
        timetable=[
            TimetableItem(
                subject="Database Systems",
                faculty="Dr. Meera Nair",
                room="Lab 204",
                start_time="09:00",
                end_time="10:00",
                status="ongoing",
            ),
            TimetableItem(
                subject="Operating Systems",
                faculty="Prof. Arjun Singh",
                room="Room A-12",
                start_time="11:00",
                end_time="12:00",
                status="upcoming",
            ),
            TimetableItem(
                subject="Software Engineering",
                faculty="Dr. Kavya Rao",
                room="Room B-07",
                start_time="14:00",
                end_time="15:30",
                status="upcoming",
            ),
        ],
        assignments=[
            AssignmentItem(
                id=1,
                title="Normalization and ER Mapping",
                subject="Database Systems",
                due_date="2026-04-09",
                status="pending",
                priority="high",
            ),
            AssignmentItem(
                id=2,
                title="Process Scheduling Case Study",
                subject="Operating Systems",
                due_date="2026-04-11",
                status="in_review",
                priority="medium",
            ),
            AssignmentItem(
                id=3,
                title="Sprint Retrospective Report",
                subject="Software Engineering",
                due_date="2026-04-14",
                status="pending",
                priority="low",
            ),
        ],
        attendance_summary=AttendanceSummary(
            percentage=87.5,
            attended_classes=42,
            total_classes=48,
            trend="+2.3% vs last month",
        ),
        marks_overview=[
            MarkItem(
                subject="Database Systems",
                exam_type="Midterm",
                score=91,
                max_score=100,
                grade="A",
            ),
            MarkItem(
                subject="Operating Systems",
                exam_type="Quiz 2",
                score=18,
                max_score=20,
                grade="A-",
            ),
            MarkItem(
                subject="Software Engineering",
                exam_type="Internal Assessment",
                score=44,
                max_score=50,
                grade="A",
            ),
        ],
    )


@router.get("/faculty/portal", response_model=FacultyPortalResponse)
def faculty_portal(
    current_user: User = Depends(require_roles(UserRole.faculty)),
) -> FacultyPortalResponse:
    return FacultyPortalResponse(
        faculty_name=current_user.full_name,
        subject="Database Systems",
        students=[FacultyStudentItem(**student) for student in FACULTY_STUDENTS],
        recent_attendance=[
            FacultyAttendanceRecord(**record)
            for record in sorted(FACULTY_ATTENDANCE, key=lambda item: item["id"], reverse=True)[:5]
        ],
        recent_marks=[
            FacultyMarkRecord(**record)
            for record in sorted(FACULTY_MARKS, key=lambda item: item["id"], reverse=True)[:5]
        ],
    )


@router.post("/faculty/attendance", response_model=FacultyAttendanceRecord)
def mark_attendance(
    payload: AttendanceCreateRequest,
    current_user: User = Depends(require_roles(UserRole.faculty)),
) -> FacultyAttendanceRecord:
    student = next((item for item in FACULTY_STUDENTS if item["id"] == payload.student_id), None)
    if student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    record = {
        "id": len(FACULTY_ATTENDANCE) + 1,
        "student_id": payload.student_id,
        "student_name": student["name"],
        "date": payload.date,
        "subject": payload.subject,
        "status": payload.status.lower(),
    }
    FACULTY_ATTENDANCE.append(record)

    attendance_delta = 0.8 if payload.status.lower() == "present" else -0.5
    student["attendance_percentage"] = max(0.0, min(100.0, round(student["attendance_percentage"] + attendance_delta, 1)))

    return FacultyAttendanceRecord(**record)


@router.post("/faculty/marks", response_model=FacultyMarkRecord)
def enter_marks(
    payload: MarkCreateRequest,
    current_user: User = Depends(require_roles(UserRole.faculty)),
) -> FacultyMarkRecord:
    student = next((item for item in FACULTY_STUDENTS if item["id"] == payload.student_id), None)
    if student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    if payload.score > payload.max_score:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Score cannot exceed max score",
        )

    record = {
        "id": len(FACULTY_MARKS) + 1,
        "student_id": payload.student_id,
        "student_name": student["name"],
        "subject": payload.subject,
        "exam_type": payload.exam_type,
        "score": payload.score,
        "max_score": payload.max_score,
    }
    FACULTY_MARKS.append(record)
    student["latest_mark"] = payload.score

    return FacultyMarkRecord(**record)


@router.get("/admin/panel", response_model=AdminPanelResponse)
def admin_panel(
    current_user: User = Depends(require_roles(UserRole.admin)),
) -> AdminPanelResponse:
    return AdminPanelResponse(
        admin_name=current_user.full_name,
        students=[AdminStudentRecord(**student) for student in ADMIN_STUDENTS],
        faculty=[AdminFacultyRecord(**faculty) for faculty in ADMIN_FACULTY],
        announcements=[AnnouncementRecord(**item) for item in sorted(ANNOUNCEMENTS, key=lambda entry: entry["id"], reverse=True)],
    )


@router.post("/admin/students", response_model=AdminStudentRecord)
def create_student(
    payload: AdminStudentUpsertRequest,
    current_user: User = Depends(require_roles(UserRole.admin)),
) -> AdminStudentRecord:
    student = {"id": _next_id(ADMIN_STUDENTS), **payload.model_dump()}
    ADMIN_STUDENTS.append(student)
    return AdminStudentRecord(**student)


@router.put("/admin/students/{student_id}", response_model=AdminStudentRecord)
def update_student(
    student_id: int,
    payload: AdminStudentUpsertRequest,
    current_user: User = Depends(require_roles(UserRole.admin)),
) -> AdminStudentRecord:
    student = next((item for item in ADMIN_STUDENTS if item["id"] == student_id), None)
    if student is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    student.update(payload.model_dump())
    return AdminStudentRecord(**student)


@router.delete("/admin/students/{student_id}", response_model=MessageResponse)
def delete_student(
    student_id: int,
    current_user: User = Depends(require_roles(UserRole.admin)),
) -> MessageResponse:
    student = next((item for item in ADMIN_STUDENTS if item["id"] == student_id), None)
    if student is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    ADMIN_STUDENTS.remove(student)
    return MessageResponse(message="Student deleted successfully")


@router.post("/admin/faculty", response_model=AdminFacultyRecord)
def create_faculty(
    payload: AdminFacultyUpsertRequest,
    current_user: User = Depends(require_roles(UserRole.admin)),
) -> AdminFacultyRecord:
    faculty = {"id": _next_id(ADMIN_FACULTY), **payload.model_dump()}
    ADMIN_FACULTY.append(faculty)
    return AdminFacultyRecord(**faculty)


@router.put("/admin/faculty/{faculty_id}", response_model=AdminFacultyRecord)
def update_faculty(
    faculty_id: int,
    payload: AdminFacultyUpsertRequest,
    current_user: User = Depends(require_roles(UserRole.admin)),
) -> AdminFacultyRecord:
    faculty = next((item for item in ADMIN_FACULTY if item["id"] == faculty_id), None)
    if faculty is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Faculty member not found")
    faculty.update(payload.model_dump())
    return AdminFacultyRecord(**faculty)


@router.delete("/admin/faculty/{faculty_id}", response_model=MessageResponse)
def delete_faculty(
    faculty_id: int,
    current_user: User = Depends(require_roles(UserRole.admin)),
) -> MessageResponse:
    faculty = next((item for item in ADMIN_FACULTY if item["id"] == faculty_id), None)
    if faculty is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Faculty member not found")
    ADMIN_FACULTY.remove(faculty)
    return MessageResponse(message="Faculty member deleted successfully")


@router.post("/admin/announcements", response_model=AnnouncementRecord)
def create_announcement(
    payload: AnnouncementUpsertRequest,
    current_user: User = Depends(require_roles(UserRole.admin)),
) -> AnnouncementRecord:
    announcement = {
        "id": _next_id(ANNOUNCEMENTS),
        "created_at": date.today().isoformat(),
        **payload.model_dump(),
    }
    ANNOUNCEMENTS.append(announcement)
    return AnnouncementRecord(**announcement)


@router.put("/admin/announcements/{announcement_id}", response_model=AnnouncementRecord)
def update_announcement(
    announcement_id: int,
    payload: AnnouncementUpsertRequest,
    current_user: User = Depends(require_roles(UserRole.admin)),
) -> AnnouncementRecord:
    announcement = next((item for item in ANNOUNCEMENTS if item["id"] == announcement_id), None)
    if announcement is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Announcement not found")
    announcement.update(payload.model_dump())
    return AnnouncementRecord(**announcement)


@router.delete("/admin/announcements/{announcement_id}", response_model=MessageResponse)
def delete_announcement(
    announcement_id: int,
    current_user: User = Depends(require_roles(UserRole.admin)),
) -> MessageResponse:
    announcement = next((item for item in ANNOUNCEMENTS if item["id"] == announcement_id), None)
    if announcement is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Announcement not found")
    ANNOUNCEMENTS.remove(announcement)
    return MessageResponse(message="Announcement deleted successfully")


@router.post("/admin/announcements/ingest-text", response_model=AnnouncementTextIngestResponse)
def ingest_announcement_text(
    payload: AnnouncementTextIngestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin)),
) -> AnnouncementTextIngestResponse:
    result = ingest_admin_announcement(payload.text, db=db, audience=payload.audience)
    return AnnouncementTextIngestResponse(**result)


@router.post("/admin/events/intake", response_model=EventIntakeResponse)
async def intake_event_text(
    payload: EventIntakeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin)),
) -> EventIntakeResponse:
    intake = await analyze_event_text(payload.text)
    stored_event_id = store_event_if_ready(intake, db)
    return EventIntakeResponse(
        ready_to_store=intake.ready_to_store,
        event=intake.event,
        follow_up_questions=intake.follow_up_questions,
        stored_event_id=stored_event_id,
    )


@router.get("/reports/overview", response_model=MessageResponse)
def reports_overview(
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.faculty)),
) -> MessageResponse:
    return MessageResponse(
        message=f"Secure overview report access granted for {current_user.role.value} {current_user.full_name}."
    )


@router.get("/reports/at-risk-students", response_model=AtRiskStudentsResponse)
async def at_risk_students_report(
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.faculty)),
) -> AtRiskStudentsResponse:
    report_students = await build_at_risk_report(FACULTY_STUDENTS)
    return AtRiskStudentsResponse(
        total_at_risk=len(report_students),
        students=[AtRiskStudentRecord(**student) for student in report_students],
    )


@router.get("/reports/student-report-card/{student_id}")
async def student_report_card(
    student_id: int,
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.faculty)),
) -> StreamingResponse:
    student = next((item for item in FACULTY_STUDENTS if item["id"] == student_id), None)
    if student is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    marks = [mark for mark in FACULTY_MARKS if mark["student_id"] == student_id]
    performance_summary = await generate_performance_summary(student, marks)
    pdf_bytes = generate_report_card_pdf(student, marks, performance_summary)

    filename = f"report-card-{student['enrollment_no']}.pdf"
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
