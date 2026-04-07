from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models import UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class MessageResponse(BaseModel):
    message: str


class HealthResponse(BaseModel):
    status: str
    app: str


class TimetableItem(BaseModel):
    subject: str
    faculty: str
    room: str
    start_time: str
    end_time: str
    status: str


class AssignmentItem(BaseModel):
    id: int
    title: str
    subject: str
    due_date: str
    status: str
    priority: str


class AttendanceSummary(BaseModel):
    percentage: float
    attended_classes: int
    total_classes: int
    trend: str


class MarkItem(BaseModel):
    subject: str
    exam_type: str
    score: float
    max_score: float
    grade: str


class StudentDashboardResponse(BaseModel):
    student_name: str
    today: str
    timetable: list[TimetableItem]
    assignments: list[AssignmentItem]
    attendance_summary: AttendanceSummary
    marks_overview: list[MarkItem]


class FacultyStudentItem(BaseModel):
    id: int
    name: str
    enrollment_no: str
    semester: int
    attendance_percentage: float
    latest_mark: float | None


class FacultyAttendanceRecord(BaseModel):
    id: int
    student_id: int
    student_name: str
    date: str
    subject: str
    status: str


class FacultyMarkRecord(BaseModel):
    id: int
    student_id: int
    student_name: str
    subject: str
    exam_type: str
    score: float
    max_score: float


class FacultyPortalResponse(BaseModel):
    faculty_name: str
    subject: str
    students: list[FacultyStudentItem]
    recent_attendance: list[FacultyAttendanceRecord]
    recent_marks: list[FacultyMarkRecord]


class AttendanceCreateRequest(BaseModel):
    student_id: int
    date: str
    subject: str
    status: str


class MarkCreateRequest(BaseModel):
    student_id: int
    subject: str
    exam_type: str
    score: float
    max_score: float


class AdminStudentRecord(BaseModel):
    id: int
    name: str
    email: str
    enrollment_no: str
    course: str
    semester: int


class AdminStudentUpsertRequest(BaseModel):
    name: str
    email: str
    enrollment_no: str
    course: str
    semester: int


class AdminFacultyRecord(BaseModel):
    id: int
    name: str
    email: str
    department: str
    designation: str


class AdminFacultyUpsertRequest(BaseModel):
    name: str
    email: str
    department: str
    designation: str


class AnnouncementRecord(BaseModel):
    id: int
    title: str
    message: str
    audience: str
    created_at: str


class AnnouncementUpsertRequest(BaseModel):
    title: str
    message: str
    audience: str


class AdminPanelResponse(BaseModel):
    admin_name: str
    students: list[AdminStudentRecord]
    faculty: list[AdminFacultyRecord]
    announcements: list[AnnouncementRecord]


class ChatbotAskRequest(BaseModel):
    question: str
    provider: str | None = None


class ChatbotAskResponse(BaseModel):
    answer: str
    provider: str
    grounded_date: str | None = None
    context_summary: list[str]


class StudyCornerRequest(BaseModel):
    topic: str


class StudyCornerResponse(BaseModel):
    topic: str
    easy_explanation: str
    real_life_analogy: str
    important_questions: list[str]


class QuizGeneratorRequest(BaseModel):
    topic: str


class QuizQuestion(BaseModel):
    question: str
    options: list[str]
    answer: str


class QuizGeneratorResponse(BaseModel):
    topic: str
    questions: list[QuizQuestion]


class AtRiskStudentRecord(BaseModel):
    student_id: int
    student_name: str
    enrollment_no: str
    attendance_percentage: float
    latest_mark: float | None
    risk_reasons: list[str]
    feedback_message: str


class AtRiskStudentsResponse(BaseModel):
    total_at_risk: int
    students: list[AtRiskStudentRecord]


class AnnouncementTextIngestRequest(BaseModel):
    text: str
    audience: str = "All"


class AnnouncementTextIngestResponse(BaseModel):
    announcement_id: int
    campus_day_id: int
    stored_date: str
    is_open: bool
    title: str
    message: str


class EventIntakeRequest(BaseModel):
    text: str


class EventDetails(BaseModel):
    title: str | None = None
    event_date: str | None = None
    start_time: str | None = None
    end_time: str | None = None
    location: str | None = None
    dress_code: str | None = None
    description: str | None = None


class EventIntakeResponse(BaseModel):
    ready_to_store: bool
    event: EventDetails
    follow_up_questions: list[str]
    stored_event_id: int | None = None
