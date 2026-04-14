'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BellRing,
  CircleAlert,
  Loader2,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserCog,
  UserPlus,
  Users,
} from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  AuthApiError,
  createAnnouncement,
  createFaculty,
  createStudent,
  deleteAnnouncement,
  deleteFaculty,
  deleteStudent,
  fetchAdminPanel,
  updateAnnouncement,
  updateFaculty,
  updateStudent,
  type AdminFacultyPayload,
  type AdminPanelData,
  type AdminStudentPayload,
  type AnnouncementPayload,
} from '@/lib/auth';

type StudentFormState = {
  name: string;
  email: string;
  enrollment_no: string;
  course: string;
  semester: string;
};

type FacultyFormState = {
  name: string;
  email: string;
  department: string;
  designation: string;
};

type AnnouncementFormState = {
  title: string;
  message: string;
  audience: string;
};

const emptyStudent: StudentFormState = {
  name: '',
  email: '',
  enrollment_no: '',
  course: '',
  semester: '1',
};

const emptyFaculty: FacultyFormState = {
  name: '',
  email: '',
  department: '',
  designation: '',
};

const emptyAnnouncement: AnnouncementFormState = {
  title: '',
  message: '',
  audience: 'All',
};

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString));
}

export default function AdminPanelPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [panel, setPanel] = useState<AdminPanelData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [studentForm, setStudentForm] = useState<StudentFormState>(emptyStudent);
  const [facultyForm, setFacultyForm] = useState<FacultyFormState>(emptyFaculty);
  const [announcementForm, setAnnouncementForm] = useState<AnnouncementFormState>(emptyAnnouncement);
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [editingFacultyId, setEditingFacultyId] = useState<number | null>(null);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<number | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const summary = useMemo(() => ({
    students: panel?.students.length ?? 0,
    faculty: panel?.faculty.length ?? 0,
    announcements: panel?.announcements.length ?? 0,
  }), [panel]);

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

  const loadPanel = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await fetchAdminPanel();
      setPanel(data);
    } catch (error) {
      const message = error instanceof AuthApiError ? error.message : 'Unable to load the admin panel.';
      setErrorMessage(message);
      if (error instanceof AuthApiError) {
        handleSessionError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPanel();
  }, []);

  const submitStudent = async () => {
    const payload: AdminStudentPayload = {
      ...studentForm,
      semester: Number(studentForm.semester),
    };
    setBusyKey('student');
    try {
      if (editingStudentId) {
        await updateStudent(editingStudentId, payload);
        toast({ title: 'Student updated', description: `${payload.name} has been updated.` });
      } else {
        await createStudent(payload);
        toast({ title: 'Student added', description: `${payload.name} has been created.` });
      }
      setStudentForm(emptyStudent);
      setEditingStudentId(null);
      await loadPanel();
    } catch (error) {
      const message = error instanceof AuthApiError ? error.message : 'Unable to save student.';
      toast({ title: 'Student action failed', description: message });
      if (error instanceof AuthApiError) handleSessionError(error);
    } finally {
      setBusyKey(null);
    }
  };

  const submitFaculty = async () => {
    const payload: AdminFacultyPayload = { ...facultyForm };
    setBusyKey('faculty');
    try {
      if (editingFacultyId) {
        await updateFaculty(editingFacultyId, payload);
        toast({ title: 'Faculty updated', description: `${payload.name} has been updated.` });
      } else {
        await createFaculty(payload);
        toast({ title: 'Faculty added', description: `${payload.name} has been created.` });
      }
      setFacultyForm(emptyFaculty);
      setEditingFacultyId(null);
      await loadPanel();
    } catch (error) {
      const message = error instanceof AuthApiError ? error.message : 'Unable to save faculty.';
      toast({ title: 'Faculty action failed', description: message });
      if (error instanceof AuthApiError) handleSessionError(error);
    } finally {
      setBusyKey(null);
    }
  };

  const submitAnnouncementAction = async () => {
    const payload: AnnouncementPayload = { ...announcementForm };
    setBusyKey('announcement');
    try {
      if (editingAnnouncementId) {
        await updateAnnouncement(editingAnnouncementId, payload);
        toast({ title: 'Announcement updated', description: `${payload.title} has been updated.` });
      } else {
        await createAnnouncement(payload);
        toast({ title: 'Announcement published', description: `${payload.title} is now live.` });
      }
      setAnnouncementForm(emptyAnnouncement);
      setEditingAnnouncementId(null);
      await loadPanel();
    } catch (error) {
      const message = error instanceof AuthApiError ? error.message : 'Unable to save announcement.';
      toast({ title: 'Announcement action failed', description: message });
      if (error instanceof AuthApiError) handleSessionError(error);
    } finally {
      setBusyKey(null);
    }
  };

  const runDelete = async (kind: 'student' | 'faculty' | 'announcement', id: number) => {
    setBusyKey(`${kind}-${id}`);
    try {
      if (kind === 'student') await deleteStudent(id);
      if (kind === 'faculty') await deleteFaculty(id);
      if (kind === 'announcement') await deleteAnnouncement(id);
      toast({ title: 'Deleted successfully', description: `${kind} record removed.` });
      await loadPanel();
    } catch (error) {
      const message = error instanceof AuthApiError ? error.message : `Unable to delete ${kind}.`;
      toast({ title: 'Delete failed', description: message });
      if (error instanceof AuthApiError) handleSessionError(error);
    } finally {
      setBusyKey(null);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#07111f_0%,_#0a1727_100%)] px-4">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-slate-200 backdrop-blur">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading your admin panel...
        </div>
      </main>
    );
  }

  if (!panel || errorMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#07111f_0%,_#0a1727_100%)] px-4">
        <Card className="w-full max-w-lg border-white/10 bg-white/[0.06] text-white backdrop-blur-xl">
          <CardHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-400/10 text-rose-200">
              <CircleAlert className="h-6 w-6" />
            </div>
            <CardTitle>Admin panel unavailable</CardTitle>
            <CardDescription className="text-slate-300">
              {errorMessage ?? 'We could not fetch your admin data.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => void loadPanel()} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
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
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin panel
            </div>
            <h1 className="mt-4 text-3xl font-semibold">Welcome, {panel.admin_name}</h1>
            <p className="mt-2 text-slate-300">Manage student records, faculty accounts, and assistant question-answer entries.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => void loadPanel()}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border-white/10 bg-white/[0.05] py-0 text-white">
            <CardHeader className="px-6 py-5">
              <CardDescription className="text-slate-400">Students</CardDescription>
              <CardTitle className="text-3xl">{summary.students}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-white/10 bg-white/[0.05] py-0 text-white">
            <CardHeader className="px-6 py-5">
              <CardDescription className="text-slate-400">Faculty</CardDescription>
              <CardTitle className="text-3xl">{summary.faculty}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-white/10 bg-white/[0.05] py-0 text-white">
            <CardHeader className="px-6 py-5">
              <CardDescription className="text-slate-400">Announcements</CardDescription>
              <CardTitle className="text-3xl">{summary.announcements}</CardTitle>
            </CardHeader>
          </Card>
        </section>

        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="grid h-auto grid-cols-3 bg-white/5 p-1 text-white">
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="faculty">Faculty</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
              <Card className="border-white/10 bg-white/[0.05] py-0 text-white">
                <CardHeader className="px-6 py-6">
                  <div className="flex items-center gap-2 text-cyan-200">
                    <UserPlus className="h-4 w-4" />
                    <span className="text-sm font-medium">{editingStudentId ? 'Edit student' : 'Add student'}</span>
                  </div>
                  <CardTitle className="text-2xl">Student form</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-6 pb-6">
                  <div className="space-y-2"><Label>Name</Label><Input value={studentForm.name} onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} className="border-white/10 bg-slate-950/40 text-white" /></div>
                  <div className="space-y-2"><Label>Email</Label><Input value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} className="border-white/10 bg-slate-950/40 text-white" /></div>
                  <div className="space-y-2"><Label>Enrollment No</Label><Input value={studentForm.enrollment_no} onChange={(e) => setStudentForm({ ...studentForm, enrollment_no: e.target.value })} className="border-white/10 bg-slate-950/40 text-white" /></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2"><Label>Course</Label><Input value={studentForm.course} onChange={(e) => setStudentForm({ ...studentForm, course: e.target.value })} className="border-white/10 bg-slate-950/40 text-white" /></div>
                    <div className="space-y-2"><Label>Semester</Label><Input type="number" value={studentForm.semester} onChange={(e) => setStudentForm({ ...studentForm, semester: e.target.value })} className="border-white/10 bg-slate-950/40 text-white" /></div>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => void submitStudent()} disabled={busyKey === 'student'} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                      {busyKey === 'student' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {editingStudentId ? 'Update student' : 'Add student'}
                    </Button>
                    {editingStudentId ? <Button variant="outline" onClick={() => { setEditingStudentId(null); setStudentForm(emptyStudent); }} className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">Cancel</Button> : null}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/[0.05] py-0 text-white">
                <CardHeader className="px-6 py-6">
                  <div className="flex items-center gap-2 text-cyan-200"><Users className="h-4 w-4" /><span className="text-sm font-medium">Student records</span></div>
                  <CardTitle className="text-2xl">Manage students</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <Table>
                    <TableHeader><TableRow className="border-white/10"><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Enrollment</TableHead><TableHead>Course</TableHead><TableHead>Semester</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {panel.students.map((student) => (
                        <TableRow key={student.id} className="border-white/10">
                          <TableCell className="font-medium text-white">{student.name}</TableCell>
                          <TableCell className="text-slate-300">{student.email}</TableCell>
                          <TableCell className="text-slate-300">{student.enrollment_no}</TableCell>
                          <TableCell className="text-slate-300">{student.course}</TableCell>
                          <TableCell className="text-slate-300">{student.semester}</TableCell>
                          <TableCell className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => { setEditingStudentId(student.id); setStudentForm({ name: student.name, email: student.email, enrollment_no: student.enrollment_no, course: student.course, semester: String(student.semester) }); }} className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"><Pencil className="h-4 w-4" /></Button>
                            <Button size="sm" variant="destructive" onClick={() => void runDelete('student', student.id)} disabled={busyKey === `student-${student.id}`}><Trash2 className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="faculty">
            <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
              <Card className="border-white/10 bg-white/[0.05] py-0 text-white">
                <CardHeader className="px-6 py-6">
                  <div className="flex items-center gap-2 text-cyan-200"><UserCog className="h-4 w-4" /><span className="text-sm font-medium">{editingFacultyId ? 'Edit faculty' : 'Add faculty'}</span></div>
                  <CardTitle className="text-2xl">Faculty form</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-6 pb-6">
                  <div className="space-y-2"><Label>Name</Label><Input value={facultyForm.name} onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })} className="border-white/10 bg-slate-950/40 text-white" /></div>
                  <div className="space-y-2"><Label>Email</Label><Input value={facultyForm.email} onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })} className="border-white/10 bg-slate-950/40 text-white" /></div>
                  <div className="space-y-2"><Label>Department</Label><Input value={facultyForm.department} onChange={(e) => setFacultyForm({ ...facultyForm, department: e.target.value })} className="border-white/10 bg-slate-950/40 text-white" /></div>
                  <div className="space-y-2"><Label>Designation</Label><Input value={facultyForm.designation} onChange={(e) => setFacultyForm({ ...facultyForm, designation: e.target.value })} className="border-white/10 bg-slate-950/40 text-white" /></div>
                  <div className="flex gap-3">
                    <Button onClick={() => void submitFaculty()} disabled={busyKey === 'faculty'} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                      {busyKey === 'faculty' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {editingFacultyId ? 'Update faculty' : 'Add faculty'}
                    </Button>
                    {editingFacultyId ? <Button variant="outline" onClick={() => { setEditingFacultyId(null); setFacultyForm(emptyFaculty); }} className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">Cancel</Button> : null}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/[0.05] py-0 text-white">
                <CardHeader className="px-6 py-6">
                  <CardTitle className="text-2xl">Manage faculty</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <Table>
                    <TableHeader><TableRow className="border-white/10"><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Department</TableHead><TableHead>Designation</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {panel.faculty.map((faculty) => (
                        <TableRow key={faculty.id} className="border-white/10">
                          <TableCell className="font-medium text-white">{faculty.name}</TableCell>
                          <TableCell className="text-slate-300">{faculty.email}</TableCell>
                          <TableCell className="text-slate-300">{faculty.department}</TableCell>
                          <TableCell className="text-slate-300">{faculty.designation}</TableCell>
                          <TableCell className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => { setEditingFacultyId(faculty.id); setFacultyForm({ name: faculty.name, email: faculty.email, department: faculty.department, designation: faculty.designation }); }} className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"><Pencil className="h-4 w-4" /></Button>
                            <Button size="sm" variant="destructive" onClick={() => void runDelete('faculty', faculty.id)} disabled={busyKey === `faculty-${faculty.id}`}><Trash2 className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="announcements">
            <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
              <Card className="border-white/10 bg-white/[0.05] py-0 text-white">
                <CardHeader className="px-6 py-6">
                  <div className="flex items-center gap-2 text-cyan-200"><BellRing className="h-4 w-4" /><span className="text-sm font-medium">{editingAnnouncementId ? 'Edit reply' : 'New reply'}</span></div>
                  <CardTitle className="text-2xl">Question-answer form</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-6 pb-6">
                  <div className="space-y-2"><Label>Question</Label><Input value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} className="border-white/10 bg-slate-950/40 text-white" /></div>
                  <div className="space-y-2"><Label>Audience</Label><Select value={announcementForm.audience} onValueChange={(value) => setAnnouncementForm({ ...announcementForm, audience: value })}><SelectTrigger className="w-full border-white/10 bg-slate-950/40 text-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All">All</SelectItem><SelectItem value="Students">Students</SelectItem><SelectItem value="Faculty">Faculty</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Answer</Label><Textarea value={announcementForm.message} onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })} className="min-h-28 border-white/10 bg-slate-950/40 text-white" /></div>
                  <div className="flex gap-3">
                    <Button onClick={() => void submitAnnouncementAction()} disabled={busyKey === 'announcement'} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                      {busyKey === 'announcement' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {editingAnnouncementId ? 'Update reply' : 'Save reply'}
                    </Button>
                    {editingAnnouncementId ? <Button variant="outline" onClick={() => { setEditingAnnouncementId(null); setAnnouncementForm(emptyAnnouncement); }} className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">Cancel</Button> : null}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/[0.05] py-0 text-white">
                <CardHeader className="px-6 py-6">
                  <CardTitle className="text-2xl">Manage announcements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-6 pb-6">
                  {panel.announcements.map((announcement) => (
                    <div key={announcement.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs uppercase tracking-[0.2em] text-cyan-200">Question</div>
                          <div className="mt-1 text-lg font-semibold text-white">{announcement.title}</div>
                          <div className="mt-1 text-sm text-slate-400">{announcement.audience} | {formatDate(announcement.created_at)}</div>
                          <div className="mt-3 text-xs uppercase tracking-[0.2em] text-cyan-200">Answer</div>
                          <p className="mt-1 text-sm leading-6 text-slate-300">{announcement.message}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setEditingAnnouncementId(announcement.id); setAnnouncementForm({ title: announcement.title, message: announcement.message, audience: announcement.audience }); }} className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"><Pencil className="h-4 w-4" /></Button>
                          <Button size="sm" variant="destructive" onClick={() => void runDelete('announcement', announcement.id)} disabled={busyKey === `announcement-${announcement.id}`}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
