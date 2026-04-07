export type UserRole = 'student' | 'faculty' | 'admin';

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface TimetableItem {
  subject: string;
  faculty: string;
  room: string;
  start_time: string;
  end_time: string;
  status: string;
}

export interface AssignmentItem {
  id: number;
  title: string;
  subject: string;
  due_date: string;
  status: string;
  priority: string;
}

export interface AttendanceSummary {
  percentage: number;
  attended_classes: number;
  total_classes: number;
  trend: string;
}

export interface MarkItem {
  subject: string;
  exam_type: string;
  score: number;
  max_score: number;
  grade: string;
}

export interface StudentDashboardData {
  student_name: string;
  today: string;
  timetable: TimetableItem[];
  assignments: AssignmentItem[];
  attendance_summary: AttendanceSummary;
  marks_overview: MarkItem[];
}

export interface FacultyStudentItem {
  id: number;
  name: string;
  enrollment_no: string;
  semester: number;
  attendance_percentage: number;
  latest_mark: number | null;
}

export interface FacultyAttendanceRecord {
  id: number;
  student_id: number;
  student_name: string;
  date: string;
  subject: string;
  status: string;
}

export interface FacultyMarkRecord {
  id: number;
  student_id: number;
  student_name: string;
  subject: string;
  exam_type: string;
  score: number;
  max_score: number;
}

export interface FacultyPortalData {
  faculty_name: string;
  subject: string;
  students: FacultyStudentItem[];
  recent_attendance: FacultyAttendanceRecord[];
  recent_marks: FacultyMarkRecord[];
}

export interface AttendanceCreatePayload {
  student_id: number;
  date: string;
  subject: string;
  status: string;
}

export interface MarkCreatePayload {
  student_id: number;
  subject: string;
  exam_type: string;
  score: number;
  max_score: number;
}

export interface AdminStudentRecord {
  id: number;
  name: string;
  email: string;
  enrollment_no: string;
  course: string;
  semester: number;
}

export interface AdminStudentPayload {
  name: string;
  email: string;
  enrollment_no: string;
  course: string;
  semester: number;
}

export interface AdminFacultyRecord {
  id: number;
  name: string;
  email: string;
  department: string;
  designation: string;
}

export interface AdminFacultyPayload {
  name: string;
  email: string;
  department: string;
  designation: string;
}

export interface AnnouncementRecord {
  id: number;
  title: string;
  message: string;
  audience: string;
  created_at: string;
}

export interface AnnouncementPayload {
  title: string;
  message: string;
  audience: string;
}

export interface AdminPanelData {
  admin_name: string;
  students: AdminStudentRecord[];
  faculty: AdminFacultyRecord[];
  announcements: AnnouncementRecord[];
}

export interface StudyCornerData {
  topic: string;
  easy_explanation: string;
  real_life_analogy: string;
  important_questions: string[];
}

export class AuthApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AuthApiError';
    this.status = status;
  }
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:8000';

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = (await response.json().catch(() => null)) as { detail?: string } | LoginResponse | null;

  if (!response.ok) {
    const message =
      typeof data?.detail === 'string'
        ? data.detail
        : 'Unable to sign in. Please check your credentials and try again.';
    throw new AuthApiError(message, response.status);
  }

  return data as LoginResponse;
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem('eduflow.access_token');
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken();

  if (!token) {
    throw new AuthApiError('Your session has expired. Please sign in again.', 401);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const data = (await response.json().catch(() => null)) as { detail?: string } | T | null;

  if (!response.ok) {
    const message =
      typeof data?.detail === 'string'
        ? data.detail
        : 'The request could not be completed.';
    throw new AuthApiError(message, response.status);
  }

  return data as T;
}

export async function fetchStudentDashboard(): Promise<StudentDashboardData> {
  return apiRequest<StudentDashboardData>('/student/dashboard', {
    method: 'GET',
  });
}

export async function fetchFacultyPortal(): Promise<FacultyPortalData> {
  return apiRequest<FacultyPortalData>('/faculty/portal', {
    method: 'GET',
  });
}

export async function submitAttendance(payload: AttendanceCreatePayload): Promise<FacultyAttendanceRecord> {
  return apiRequest<FacultyAttendanceRecord>('/faculty/attendance', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function submitMark(payload: MarkCreatePayload): Promise<FacultyMarkRecord> {
  return apiRequest<FacultyMarkRecord>('/faculty/marks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchAdminPanel(): Promise<AdminPanelData> {
  return apiRequest<AdminPanelData>('/admin/panel', { method: 'GET' });
}

export async function createStudent(payload: AdminStudentPayload): Promise<AdminStudentRecord> {
  return apiRequest<AdminStudentRecord>('/admin/students', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateStudent(studentId: number, payload: AdminStudentPayload): Promise<AdminStudentRecord> {
  return apiRequest<AdminStudentRecord>(`/admin/students/${studentId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteStudent(studentId: number): Promise<void> {
  await apiRequest<{ message: string }>(`/admin/students/${studentId}`, { method: 'DELETE' });
}

export async function createFaculty(payload: AdminFacultyPayload): Promise<AdminFacultyRecord> {
  return apiRequest<AdminFacultyRecord>('/admin/faculty', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateFaculty(facultyId: number, payload: AdminFacultyPayload): Promise<AdminFacultyRecord> {
  return apiRequest<AdminFacultyRecord>(`/admin/faculty/${facultyId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteFaculty(facultyId: number): Promise<void> {
  await apiRequest<{ message: string }>(`/admin/faculty/${facultyId}`, { method: 'DELETE' });
}

export async function createAnnouncement(payload: AnnouncementPayload): Promise<AnnouncementRecord> {
  return apiRequest<AnnouncementRecord>('/admin/announcements', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAnnouncement(
  announcementId: number,
  payload: AnnouncementPayload
): Promise<AnnouncementRecord> {
  return apiRequest<AnnouncementRecord>(`/admin/announcements/${announcementId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteAnnouncement(announcementId: number): Promise<void> {
  await apiRequest<{ message: string }>(`/admin/announcements/${announcementId}`, { method: 'DELETE' });
}

export async function generateStudyCorner(topic: string): Promise<StudyCornerData> {
  const response = await fetch(`${API_BASE_URL}/study-corner/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ topic }),
  });

  const data = (await response.json().catch(() => null)) as { detail?: string } | StudyCornerData | null;

  if (!response.ok) {
    const message =
      typeof data?.detail === 'string'
        ? data.detail
        : 'Unable to generate Study Corner content right now.';
    throw new AuthApiError(message, response.status);
  }

  return data as StudyCornerData;
}

export function getRoleLandingPath(role: UserRole): string {
  switch (role) {
    case 'student':
      return '/student/dashboard';
    case 'faculty':
      return '/faculty/portal';
    case 'admin':
      return '/admin/panel';
    default:
      return '/chat';
  }
}
