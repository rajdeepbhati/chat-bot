'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, BookOpen, GraduationCap, Loader2, KeyRound, Sparkles } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { AuthApiError, getRoleLandingPath, loginUser, type UserRole } from '@/lib/auth';

const roleOptions: Array<{
  value: UserRole;
  label: string;
  description: string;
  icon: typeof GraduationCap;
}> = [
  {
    value: 'student',
    label: 'Student',
    description: 'Access timetable, attendance, grades, and AI support.',
    icon: GraduationCap,
  },
  {
    value: 'faculty',
    label: 'Faculty',
    description: 'Manage classes, announcements, attendance, and reports.',
    icon: BookOpen,
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Control portal settings, user roles, and campus insights.',
    icon: ShieldCheck,
  },
];

export default function Home() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeRole = roleOptions.find((option) => option.value === selectedRole) ?? roleOptions[0];
  const ActiveRoleIcon = activeRole.icon;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Email and password are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await loginUser(email.trim(), password);

      if (result.user.role !== selectedRole) {
        setErrorMessage(
          `This account is registered as ${result.user.role}. Please switch the role selection and try again.`
        );
        return;
      }

      localStorage.setItem('eduflow.access_token', result.access_token);
      localStorage.setItem('eduflow.user', JSON.stringify(result.user));

      toast({
        title: 'Signed in successfully',
        description: `Welcome back, ${result.user.full_name}.`,
      });

      router.push(getRoleLandingPath(result.user.role));
    } catch (error) {
      const message =
        error instanceof AuthApiError
          ? error.message
          : 'Could not reach the server. Make sure the backend is running and accessible from http://127.0.0.1:8000.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(30,64,175,0.28),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(13,148,136,0.24),_transparent_30%),linear-gradient(135deg,_#07111f_0%,_#0d1729_45%,_#091423_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-10 lg:flex-row lg:items-center lg:gap-12">
        <section className="mb-10 max-w-2xl lg:mb-0 lg:flex-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1.5 text-sm text-cyan-100 backdrop-blur">
            <Sparkles className="h-4 w-4" />
            EduFlow AI-Integrated Campus Portal
          </div>
          <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            One secure sign-in for every campus workflow.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
            Connect students, faculty, and administrators through a modern portal with role-based access,
            AI assistance, and secure academic operations.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {roleOptions.map((role) => {
              const Icon = role.icon;
              const isActive = role.value === selectedRole;

              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => {
                    setSelectedRole(role.value);
                    setErrorMessage(null);
                  }}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    isActive
                      ? 'border-cyan-300/40 bg-white/10 shadow-[0_0_0_1px_rgba(125,211,252,0.15)]'
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-cyan-200' : 'text-slate-300'}`} />
                  <div className="mt-3 text-sm font-medium text-white">{role.label}</div>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{role.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="w-full max-w-md lg:w-[28rem]">
          <Card className="border-white/10 bg-white/[0.08] py-0 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
            <CardHeader className="border-b border-white/10 px-6 py-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 text-slate-950 shadow-lg shadow-cyan-500/20">
                <ActiveRoleIcon className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl text-white">{activeRole.label} Login</CardTitle>
              <CardDescription className="text-slate-300">
                Enter your credentials to access your EduFlow workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 py-6">
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-slate-200">Role</Label>
                  <Select
                    value={selectedRole}
                    onValueChange={(value) => {
                      setSelectedRole(value as UserRole);
                      setErrorMessage(null);
                    }}
                  >
                    <SelectTrigger id="role" className="w-full border-white/10 bg-slate-950/40 text-white">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-200">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@campus.edu"
                    autoComplete="email"
                    className="h-11 border-white/10 bg-slate-950/40 text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-slate-200">Password</Label>
                    <span className="text-xs text-slate-400">JWT-secured session</span>
                  </div>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="h-11 border-white/10 bg-slate-950/40 pl-10 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                    {errorMessage}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 font-semibold text-slate-950 hover:from-cyan-300 hover:to-teal-300"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in to EduFlow'
                  )}
                </Button>
              </form>

              <div className="mt-6 rounded-xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-300">
                <div className="font-medium text-white">Backend connection</div>
                <p className="mt-1 leading-6">
                  This page calls the FastAPI JWT endpoint at{' '}
                  <span className="font-mono text-cyan-200">
                    {process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000'}
                  </span>
                  .
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
