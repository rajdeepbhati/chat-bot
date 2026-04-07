'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpenCheck,
  CircleAlert,
  ClipboardCheck,
  GraduationCap,
  Loader2,
  PencilLine,
  RefreshCw,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  AuthApiError,
  fetchFacultyPortal,
  submitAttendance,
  submitMark,
  type FacultyAttendanceRecord,
  type FacultyMarkRecord,
  type FacultyPortalData,
} from '@/lib/auth';

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString));
}

function statusVariant(status: string): 'default' | 'secondary' | 'outline' {
  if (status === 'present') return 'default';
  if (status === 'late') return 'secondary';
  return 'outline';
}

const todayString = new Date().toISOString().slice(0, 10);

export default function FacultyPortalPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [portal, setPortal] = useState<FacultyPortalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attendanceStudentId, setAttendanceStudentId] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [attendanceDate, setAttendanceDate] = useState(todayString);
  const [examType, setExamType] = useState('Midterm');
  const [markStudentId, setMarkStudentId] = useState('');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);
  const [isSubmittingMark, setIsSubmittingMark] = useState(false);

  const handleSessionError = (error: AuthApiError) => {
    if (error.status === 401) {
      localStorage.removeItem('eduflow.access_token');
      localStorage.removeItem('eduflow.user');
      toast({
        title: 'Session expired',
        description: 'Please sign in again to continue.',
      });
      router.push('/');
    }
  };

  const loadPortal = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await fetchFacultyPortal();
      setPortal(data);
      if (!attendanceStudentId && data.students[0]) {
        setAttendanceStudentId(String(data.students[0].id));
      }
      if (!markStudentId && data.students[0]) {
        setMarkStudentId(String(data.students[0].id));
      }
    } catch (error) {
      const message =
        error instanceof AuthApiError ? error.message : 'Unable to load the faculty portal.';
      setErrorMessage(message);
      if (error instanceof AuthApiError) {
        handleSessionError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPortal();
  }, []);

  const onSubmitAttendance = async () => {
    if (!attendanceStudentId || !portal) return;

    setIsSubmittingAttendance(true);
    try {
      const record = await submitAttendance({
        student_id: Number(attendanceStudentId),
        date: attendanceDate,
        subject: portal.subject,
        status: attendanceStatus,
      });

      toast({
        title: 'Attendance saved',
        description: `${record.student_name} marked ${record.status}.`,
      });
      await loadPortal();
    } catch (error) {
      const message =
        error instanceof AuthApiError ? error.message : 'Unable to save attendance.';
      toast({
        title: 'Attendance update failed',
        description: message,
      });
      if (error instanceof AuthApiError) {
        handleSessionError(error);
      }
    } finally {
      setIsSubmittingAttendance(false);
    }
  };

  const onSubmitMark = async () => {
    if (!markStudentId || !portal || !score || !maxScore) return;

    setIsSubmittingMark(true);
    try {
      const record = await submitMark({
        student_id: Number(markStudentId),
        subject: portal.subject,
        exam_type: examType,
        score: Number(score),
        max_score: Number(maxScore),
      });

      toast({
        title: 'Marks saved',
        description: `${record.student_name} scored ${record.score}/${record.max_score}.`,
      });
      setScore('');
      await loadPortal();
    } catch (error) {
      const message =
        error instanceof AuthApiError ? error.message : 'Unable to save marks.';
      toast({
        title: 'Marks update failed',
        description: message,
      });
      if (error instanceof AuthApiError) {
        handleSessionError(error);
      }
    } finally {
      setIsSubmittingMark(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#07111f_0%,_#0a1727_100%)] px-4">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-slate-200 backdrop-blur">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading your faculty portal...
        </div>
      </main>
    );
  }

  if (!portal || errorMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#07111f_0%,_#0a1727_100%)] px-4">
        <Card className="w-full max-w-lg border-white/10 bg-white/[0.06] text-white backdrop-blur-xl">
          <CardHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-400/10 text-rose-200">
              <CircleAlert className="h-6 w-6" />
            </div>
            <CardTitle>Faculty portal unavailable</CardTitle>
            <CardDescription className="text-slate-300">
              {errorMessage ?? 'We could not fetch your faculty data.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => void loadPortal()} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_22%),linear-gradient(180deg,_#07111f_0%,_#0a1727_100%)] px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.05] p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-100">
              <BookOpenCheck className="h-3.5 w-3.5" />
              Faculty portal
            </div>
            <h1 className="mt-4 text-3xl font-semibold">Welcome, {portal.faculty_name}</h1>
            <p className="mt-2 text-slate-300">
              Manage attendance, marks, and your student roster for {portal.subject}.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => void loadPortal()}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              onClick={() => router.push('/chat')}
              className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
            >
              Open AI Assistant
            </Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border-white/10 bg-white/[0.05] py-0 text-white">
            <CardHeader className="px-6 py-5">
              <CardDescription className="text-slate-400">Class strength</CardDescription>
              <CardTitle className="text-3xl">{portal.students.length}</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-5 text-sm text-slate-300">
              Active students currently mapped to your course roster.
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/[0.05] py-0 text-white">
            <CardHeader className="px-6 py-5">
              <CardDescription className="text-slate-400">Recent attendance</CardDescription>
              <CardTitle className="text-3xl">{portal.recent_attendance.length}</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-5 text-sm text-slate-300">
              Latest attendance records updated for this subject.
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/[0.05] py-0 text-white">
            <CardHeader className="px-6 py-5">
              <CardDescription className="text-slate-400">Recent marks</CardDescription>
              <CardTitle className="text-3xl">{portal.recent_marks.length}</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-5 text-sm text-slate-300">
              Fresh assessment entries available for review.
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-white/10 bg-white/[0.05] py-0 text-white">
            <CardHeader className="px-6 py-6">
              <div className="flex items-center gap-2 text-cyan-200">
                <ClipboardCheck className="h-4 w-4" />
                <span className="text-sm font-medium">Mark attendance</span>
              </div>
              <CardTitle className="text-2xl">Update student attendance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6">
              <div className="space-y-2">
                <Label className="text-slate-200">Student</Label>
                <Select value={attendanceStudentId} onValueChange={setAttendanceStudentId}>
                  <SelectTrigger className="w-full border-white/10 bg-slate-950/40 text-white">
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {portal.students.map((student) => (
                      <SelectItem key={student.id} value={String(student.id)}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-200">Date</Label>
                  <Input
                    type="date"
                    value={attendanceDate}
                    onChange={(event) => setAttendanceDate(event.target.value)}
                    className="border-white/10 bg-slate-950/40 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Status</Label>
                  <Select value={attendanceStatus} onValueChange={setAttendanceStatus}>
                    <SelectTrigger className="w-full border-white/10 bg-slate-950/40 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={() => void onSubmitAttendance()}
                disabled={isSubmittingAttendance}
                className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300"
              >
                {isSubmittingAttendance ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving attendance...
                  </>
                ) : (
                  'Save attendance'
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.05] py-0 text-white">
            <CardHeader className="px-6 py-6">
              <div className="flex items-center gap-2 text-cyan-200">
                <PencilLine className="h-4 w-4" />
                <span className="text-sm font-medium">Enter marks</span>
              </div>
              <CardTitle className="text-2xl">Record assessment scores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6">
              <div className="space-y-2">
                <Label className="text-slate-200">Student</Label>
                <Select value={markStudentId} onValueChange={setMarkStudentId}>
                  <SelectTrigger className="w-full border-white/10 bg-slate-950/40 text-white">
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {portal.students.map((student) => (
                      <SelectItem key={student.id} value={String(student.id)}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-1">
                  <Label className="text-slate-200">Exam type</Label>
                  <Input
                    value={examType}
                    onChange={(event) => setExamType(event.target.value)}
                    className="border-white/10 bg-slate-950/40 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Score</Label>
                  <Input
                    type="number"
                    value={score}
                    onChange={(event) => setScore(event.target.value)}
                    className="border-white/10 bg-slate-950/40 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Max score</Label>
                  <Input
                    type="number"
                    value={maxScore}
                    onChange={(event) => setMaxScore(event.target.value)}
                    className="border-white/10 bg-slate-950/40 text-white"
                  />
                </div>
              </div>
              <Button
                onClick={() => void onSubmitMark()}
                disabled={isSubmittingMark}
                className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300"
              >
                {isSubmittingMark ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving marks...
                  </>
                ) : (
                  'Save marks'
                )}
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-white/10 bg-white/[0.05] py-0 text-white">
            <CardHeader className="px-6 py-6">
              <div className="flex items-center gap-2 text-cyan-200">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Student list</span>
              </div>
              <CardTitle className="text-2xl">Your current roster</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead>Name</TableHead>
                    <TableHead>Enrollment</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Latest mark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portal.students.map((student) => (
                    <TableRow key={student.id} className="border-white/10">
                      <TableCell className="font-medium text-white">{student.name}</TableCell>
                      <TableCell className="text-slate-300">{student.enrollment_no}</TableCell>
                      <TableCell className="text-slate-300">{student.semester}</TableCell>
                      <TableCell className="text-slate-300">{student.attendance_percentage}%</TableCell>
                      <TableCell className="text-slate-300">
                        {student.latest_mark !== null ? student.latest_mark : '--'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-white/10 bg-white/[0.05] py-0 text-white">
              <CardHeader className="px-6 py-6">
                <CardTitle className="text-xl">Recent attendance records</CardTitle>
                <CardDescription className="text-slate-300">Most recent submissions for this class.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 px-6 pb-6">
                {portal.recent_attendance.map((record: FacultyAttendanceRecord) => (
                  <div key={record.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-white">{record.student_name}</div>
                        <div className="text-sm text-slate-400">{formatDate(record.date)}</div>
                      </div>
                      <Badge variant={statusVariant(record.status)} className="capitalize">
                        {record.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.05] py-0 text-white">
              <CardHeader className="px-6 py-6">
                <CardTitle className="text-xl">Recent marks entries</CardTitle>
                <CardDescription className="text-slate-300">Latest recorded assessments.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 px-6 pb-6">
                {portal.recent_marks.map((record: FacultyMarkRecord) => (
                  <div key={record.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-white">{record.student_name}</div>
                        <div className="text-sm text-slate-400">{record.exam_type}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-cyan-200">
                          {record.score}/{record.max_score}
                        </div>
                        <div className="text-xs text-slate-400">{record.subject}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
