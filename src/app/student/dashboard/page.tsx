'use client';

import { useEffect, useState } from 'react';
import {
  AlarmClock,
  BookCopy,
  CalendarDays,
  CircleAlert,
  GraduationCap,
  Loader2,
  RefreshCw,
  SquareCheckBig,
  Trophy,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
  fetchStudentDashboard,
  type AssignmentItem,
  type MarkItem,
  type StudentDashboardData,
  type TimetableItem,
} from '@/lib/auth';

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'outline' {
  if (status === 'ongoing' || status === 'pending') {
    return 'default';
  }

  if (status === 'in_review') {
    return 'secondary';
  }

  return 'outline';
}

function priorityClass(priority: string): string {
  if (priority === 'high') return 'text-rose-300';
  if (priority === 'medium') return 'text-amber-300';
  return 'text-emerald-300';
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString));
}

function TimetableCard({ item }: { item: TimetableItem }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-slate-400">{item.start_time} - {item.end_time}</div>
          <h3 className="mt-1 text-lg font-semibold text-white">{item.subject}</h3>
          <p className="mt-1 text-sm text-slate-300">{item.faculty}</p>
        </div>
        <Badge variant={statusBadgeVariant(item.status)} className="capitalize">
          {item.status}
        </Badge>
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
        <AlarmClock className="h-4 w-4" />
        <span>{item.room}</span>
      </div>
    </div>
  );
}

function AssignmentRow({ item }: { item: AssignmentItem }) {
  return (
    <TableRow>
      <TableCell className="font-medium text-white">{item.title}</TableCell>
      <TableCell className="text-slate-300">{item.subject}</TableCell>
      <TableCell className="text-slate-300">{formatDate(item.due_date)}</TableCell>
      <TableCell>
        <Badge variant={statusBadgeVariant(item.status)} className="capitalize">
          {item.status.replace('_', ' ')}
        </Badge>
      </TableCell>
      <TableCell className={`font-medium capitalize ${priorityClass(item.priority)}`}>
        {item.priority}
      </TableCell>
    </TableRow>
  );
}

function MarkRow({ item }: { item: MarkItem }) {
  const percentage = Math.round((item.score / item.max_score) * 100);

  return (
    <TableRow>
      <TableCell className="font-medium text-white">{item.subject}</TableCell>
      <TableCell className="text-slate-300">{item.exam_type}</TableCell>
      <TableCell className="text-slate-300">{item.score} / {item.max_score}</TableCell>
      <TableCell className="w-[180px]">
        <div className="flex items-center gap-3">
          <Progress value={percentage} className="bg-white/10" />
          <span className="min-w-10 text-xs text-slate-300">{percentage}%</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200">
          {item.grade}
        </Badge>
      </TableCell>
    </TableRow>
  );
}

export default function StudentDashboardPage() {
  const { toast } = useToast();
  const [dashboard, setDashboard] = useState<StudentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await fetchStudentDashboard();
      setDashboard(data);
    } catch (error) {
      const message =
        error instanceof AuthApiError
          ? error.message
          : 'Unable to load your student dashboard.';
      setErrorMessage(message);

      if (error instanceof AuthApiError && error.status === 401) {
        localStorage.removeItem('eduflow.access_token');
        localStorage.removeItem('eduflow.user');
        toast({
          title: 'Session expired',
          description: 'Please sign in again to continue.',
        });
        router.push('/');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#07111f_0%,_#0a1727_100%)] px-4">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-slate-200 backdrop-blur">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading your dashboard...
        </div>
      </main>
    );
  }

  if (!dashboard || errorMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#07111f_0%,_#0a1727_100%)] px-4">
        <Card className="w-full max-w-lg border-white/10 bg-white/[0.06] text-white backdrop-blur-xl">
          <CardHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-400/10 text-rose-200">
              <CircleAlert className="h-6 w-6" />
            </div>
            <CardTitle>Dashboard unavailable</CardTitle>
            <CardDescription className="text-slate-300">
              {errorMessage ?? 'We could not fetch your student data.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => void loadDashboard()} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const attendancePercent = Math.round(dashboard.attendance_summary.percentage);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_22%),linear-gradient(180deg,_#07111f_0%,_#0a1727_100%)] px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.05] p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-100">
              <GraduationCap className="h-3.5 w-3.5" />
              Student dashboard
            </div>
            <h1 className="mt-4 text-3xl font-semibold">Welcome back, {dashboard.student_name}</h1>
            <p className="mt-2 text-slate-300">
              Here&apos;s your academic snapshot for {formatDate(dashboard.today)}.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => void loadDashboard()}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-white/10 bg-white/[0.05] py-0 text-white">
            <CardHeader className="px-6 py-5">
              <CardDescription className="text-slate-400">Today&apos;s sessions</CardDescription>
              <CardTitle className="text-3xl">{dashboard.timetable.length}</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-5 text-sm text-slate-300">
              Your first class starts at {dashboard.timetable[0]?.start_time ?? '--:--'}.
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.05] py-0 text-white">
            <CardHeader className="px-6 py-5">
              <CardDescription className="text-slate-400">Pending assignments</CardDescription>
              <CardTitle className="text-3xl">
                {dashboard.assignments.filter((item) => item.status === 'pending').length}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-5 text-sm text-slate-300">
              Next due: {formatDate(dashboard.assignments[0]?.due_date ?? dashboard.today)}.
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.05] py-0 text-white">
            <CardHeader className="px-6 py-5">
              <CardDescription className="text-slate-400">Attendance</CardDescription>
              <CardTitle className="text-3xl">{attendancePercent}%</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-6 pb-5 text-sm text-slate-300">
              <Progress value={attendancePercent} className="bg-white/10" />
              <div>{dashboard.attendance_summary.attended_classes} of {dashboard.attendance_summary.total_classes} classes attended</div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.05] py-0 text-white">
            <CardHeader className="px-6 py-5">
              <CardDescription className="text-slate-400">Average marks</CardDescription>
              <CardTitle className="text-3xl">
                {Math.round(
                  dashboard.marks_overview.reduce((sum, item) => sum + (item.score / item.max_score) * 100, 0) /
                    dashboard.marks_overview.length
                )}%
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-5 text-sm text-slate-300">
              Performance remains strong across current assessments.
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-white/10 bg-white/[0.05] py-0 text-white">
            <CardHeader className="px-6 py-6">
              <div className="flex items-center gap-2 text-cyan-200">
                <CalendarDays className="h-4 w-4" />
                <span className="text-sm font-medium">Today&apos;s timetable</span>
              </div>
              <CardTitle className="text-2xl">Your class schedule</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 px-6 pb-6 md:grid-cols-2 2xl:grid-cols-3">
              {dashboard.timetable.map((item) => (
                <TimetableCard key={`${item.subject}-${item.start_time}`} item={item} />
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.05] py-0 text-white">
            <CardHeader className="px-6 py-6">
              <div className="flex items-center gap-2 text-cyan-200">
                <SquareCheckBig className="h-4 w-4" />
                <span className="text-sm font-medium">Attendance summary</span>
              </div>
              <CardTitle className="text-2xl">Consistency tracker</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 px-6 pb-6">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                <div className="text-sm text-emerald-100">Current attendance</div>
                <div className="mt-2 text-4xl font-semibold text-white">{attendancePercent}%</div>
                <div className="mt-2 text-sm text-emerald-100/90">{dashboard.attendance_summary.trend}</div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Academic compliance</span>
                  <span>{dashboard.attendance_summary.attended_classes}/{dashboard.attendance_summary.total_classes}</span>
                </div>
                <Progress value={attendancePercent} className="h-3 bg-white/10" />
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
                Stay above 85% to remain comfortably within attendance requirements.
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card className="border-white/10 bg-white/[0.05] py-0 text-white">
            <CardHeader className="px-6 py-6">
              <div className="flex items-center gap-2 text-cyan-200">
                <BookCopy className="h-4 w-4" />
                <span className="text-sm font-medium">Assignments</span>
              </div>
              <CardTitle className="text-2xl">Submission queue</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead>Task</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.assignments.map((item) => (
                    <AssignmentRow key={item.id} item={item} />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.05] py-0 text-white">
            <CardHeader className="px-6 py-6">
              <div className="flex items-center gap-2 text-cyan-200">
                <Trophy className="h-4 w-4" />
                <span className="text-sm font-medium">Marks overview</span>
              </div>
              <CardTitle className="text-2xl">Latest assessment performance</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead>Subject</TableHead>
                    <TableHead>Exam</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.marks_overview.map((item) => (
                    <MarkRow key={`${item.subject}-${item.exam_type}`} item={item} />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
