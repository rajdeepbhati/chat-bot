'use client';

import { FormEvent, useState } from 'react';
import { BookOpenText, Brain, CircleHelp, Lightbulb, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AuthApiError, generateStudyCorner, type StudyCornerData } from '@/lib/auth';

const sampleTopics = ['Photosynthesis', 'Binary Search', 'Newton’s Laws of Motion', 'Database Normalization'];

export default function StudyCornerPage() {
  const { toast } = useToast();
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState<StudyCornerData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!topic.trim()) {
      setErrorMessage('Please enter a topic name.');
      return;
    }

    setIsLoading(true);

    try {
      const data = await generateStudyCorner(topic.trim());
      setResult(data);
      toast({
        title: 'Study Corner ready',
        description: `Generated learning notes for ${data.topic}.`,
      });
    } catch (error) {
      const message =
        error instanceof AuthApiError
          ? error.message
          : 'Something went wrong while generating the study content.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.14),_transparent_22%),linear-gradient(180deg,_#08111d_0%,_#0d1728_100%)] px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-100">
            <Sparkles className="h-3.5 w-3.5" />
            AI Study Corner
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Turn a topic into a study guide in seconds.</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Enter any topic and get a simple explanation, an everyday analogy, and important questions to revise before class or exams.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <Label htmlFor="topic" className="text-slate-200">Topic name</Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder="Example: Operating System Scheduling"
                  className="h-12 border-white/10 bg-slate-950/40 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-amber-300 font-semibold text-slate-950 hover:from-cyan-300 hover:to-amber-200 lg:w-48"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Notes'
                  )}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {sampleTopics.map((sampleTopic) => (
                <button
                  key={sampleTopic}
                  type="button"
                  onClick={() => setTopic(sampleTopic)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                >
                  {sampleTopic}
                </button>
              ))}
            </div>

            {errorMessage ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {errorMessage}
              </div>
            ) : null}
          </form>
        </section>

        {result ? (
          <section className="grid gap-6 lg:grid-cols-3">
            <Card className="border-white/10 bg-white/[0.05] py-0 text-white">
              <CardHeader className="px-6 py-6">
                <div className="flex items-center gap-2 text-cyan-200">
                  <BookOpenText className="h-4 w-4" />
                  <span className="text-sm font-medium">Easy explanation</span>
                </div>
                <CardTitle className="text-2xl">{result.topic}</CardTitle>
                <CardDescription className="text-slate-300">
                  A simple version you can quickly understand.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6 leading-7 text-slate-200">
                {result.easy_explanation}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.05] py-0 text-white">
              <CardHeader className="px-6 py-6">
                <div className="flex items-center gap-2 text-amber-200">
                  <Lightbulb className="h-4 w-4" />
                  <span className="text-sm font-medium">Real-life analogy</span>
                </div>
                <CardTitle className="text-2xl">Think of it like this</CardTitle>
                <CardDescription className="text-slate-300">
                  A memory-friendly comparison from daily life.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6 leading-7 text-slate-200">
                {result.real_life_analogy}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.05] py-0 text-white">
              <CardHeader className="px-6 py-6">
                <div className="flex items-center gap-2 text-emerald-200">
                  <CircleHelp className="h-4 w-4" />
                  <span className="text-sm font-medium">Important questions</span>
                </div>
                <CardTitle className="text-2xl">IMP for revision</CardTitle>
                <CardDescription className="text-slate-300">
                  Key questions to test your understanding.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <ul className="space-y-3">
                  {result.important_questions.map((question, index) => (
                    <li
                      key={`${question}-${index}`}
                      className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm leading-6 text-slate-200"
                    >
                      <span className="mr-2 font-semibold text-cyan-200">{index + 1}.</span>
                      {question}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-3">
            <Card className="border-white/10 bg-white/[0.04] py-0 text-white">
              <CardHeader className="px-6 py-6">
                <Brain className="h-8 w-8 text-cyan-200" />
                <CardTitle className="mt-3">Simple breakdowns</CardTitle>
                <CardDescription className="text-slate-300">
                  Complex topics become easy-to-read explanations.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-white/10 bg-white/[0.04] py-0 text-white">
              <CardHeader className="px-6 py-6">
                <Lightbulb className="h-8 w-8 text-amber-200" />
                <CardTitle className="mt-3">Everyday analogies</CardTitle>
                <CardDescription className="text-slate-300">
                  Learn faster with examples connected to real life.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-white/10 bg-white/[0.04] py-0 text-white">
              <CardHeader className="px-6 py-6">
                <CircleHelp className="h-8 w-8 text-emerald-200" />
                <CardTitle className="mt-3">Exam-focused questions</CardTitle>
                <CardDescription className="text-slate-300">
                  Practice the important questions that matter most.
                </CardDescription>
              </CardHeader>
            </Card>
          </section>
        )}
      </div>
    </main>
  );
}
