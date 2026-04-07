'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { Bot, MessageSquare, Minimize2, SendHorizonal, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

type WidgetMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const STARTER_MESSAGES: WidgetMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content: 'Hi! I am your campus assistant. Ask me anything about schedules, academics, or announcements.',
  },
];

const QUICK_PROMPTS = [
  'Is college open tomorrow?',
  'Show me today’s classes',
  'Explain database normalization',
];

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>(STARTER_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const sendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || isLoading) {
      return;
    }

    const userMessage: WidgetMessage = {
      id: generateId(),
      role: 'user',
      content: trimmed,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      const data = (await response.json().catch(() => null)) as { content?: string; error?: string } | null;

      if (!response.ok) {
        throw new Error(data?.error || `Chat request failed with status ${response.status}`);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: 'assistant',
          content: data?.content?.trim() || 'I could not generate a response just now.',
        },
      ]);
    } catch (err) {
      setError((err as Error).message || 'Something went wrong while contacting the chat API.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendMessage(input);
  };

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 sm:right-6 sm:bottom-6">
      {isOpen ? (
        <Card className="pointer-events-auto flex h-[min(70vh,38rem)] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden border-white/10 bg-slate-950/95 text-white shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
          <CardHeader className="border-b border-white/10 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-950">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Campus AI Assistant</CardTitle>
                  <div className="text-xs text-slate-400">Always here in the corner</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setMessages(STARTER_MESSAGES);
                    setInput('');
                    setError(null);
                    setIsOpen(false);
                  }}
                  className="h-8 w-8 text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-0">
            <ScrollArea className="flex-1 px-4 py-4">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                        message.role === 'user'
                          ? 'bg-cyan-400 text-slate-950'
                          : 'border border-white/10 bg-white/5 text-slate-100'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}

                {isLoading ? (
                  <div className="flex justify-start">
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                      Thinking...
                    </div>
                  </div>
                ) : null}

                {messages.length === 1 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => void sendMessage(prompt)}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                ) : null}

                {error ? (
                  <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                    {error}
                  </div>
                ) : null}

                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            <form onSubmit={handleSubmit} className="border-t border-white/10 p-4">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask the assistant..."
                  className="h-11 border-white/10 bg-slate-900/80 text-white placeholder:text-slate-500"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="h-11 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 text-slate-950 hover:from-cyan-300 hover:to-blue-400"
                >
                  <SendHorizonal className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto h-14 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 px-5 text-slate-950 shadow-xl shadow-cyan-900/30 hover:from-cyan-300 hover:via-sky-300 hover:to-blue-400"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          <MessageSquare className="mr-2 h-4 w-4" />
          Chat with AI
        </Button>
      )}
    </div>
  );
}
