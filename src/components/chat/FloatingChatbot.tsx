'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Maximize2, MessageSquare, Mic, Minimize2, SendHorizonal, Sparkles, Square, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSpeechToText } from '@/hooks/useSpeechToText';

type WidgetMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const STARTER_MESSAGES: WidgetMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content: 'Ask a saved announcement question.',
  },
];

const QUICK_PROMPTS = [
  'Mid-Semester Review',
  'Database Lab Schedule',
];

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>(STARTER_MESSAGES);
  const [input, setInput] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const voiceDraftBaseRef = useRef('');
  const {
    error: speechError,
    finalTranscript,
    interimTranscript,
    isListening,
    isSupported,
    startListening,
    stopListening,
  } = useSpeechToText({ language: selectedLanguage });

  const languageOptions = [
    { value: 'en-US', label: 'EN' },
    { value: 'hi-IN', label: 'HI' },
    { value: 'es-ES', label: 'ES' },
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isListening && !finalTranscript && !interimTranscript) {
      return;
    }

    const voiceText = [finalTranscript, interimTranscript].filter(Boolean).join(' ').trim();
    const nextValue = [voiceDraftBaseRef.current, voiceText].filter(Boolean).join(' ').trim();
    setInput(nextValue);
  }, [finalTranscript, interimTranscript, isListening]);

  const sendMessage = useCallback(async (content: string) => {
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
    voiceDraftBaseRef.current = '';
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
  }, [isLoading, messages]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendMessage(input);
  };

  const handleStartListening = async () => {
    if (isListening || isLoading) {
      return;
    }

    voiceDraftBaseRef.current = input.trim();
    await startListening();
  };

  const handleStopListening = () => {
    const voiceText = [finalTranscript, interimTranscript].filter(Boolean).join(' ').trim();
    const nextValue = [voiceDraftBaseRef.current, voiceText].filter(Boolean).join(' ').trim();
    stopListening();

    if (nextValue && !speechError && !isLoading) {
      void sendMessage(nextValue);
    }
  };

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      {isOpen ? (
        <Card className={`pointer-events-auto flex flex-col gap-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0B1120]/95 py-0 text-white shadow-2xl shadow-black/40 backdrop-blur-xl transition-all duration-300 ${isMaximized ? 'fixed inset-4 z-[60] h-auto w-auto' : 'h-[480px] w-[340px] max-w-[calc(100vw-2rem)]'}`}>
          <CardHeader className="shrink-0 border-b border-white/10 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-950">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Campus AI Assistant</CardTitle>
                  <div className="text-xs text-slate-400">Replies from saved announcements only</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="h-8 w-8 text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    stopListening();
                    setMessages(STARTER_MESSAGES);
                    setInput('');
                    voiceDraftBaseRef.current = '';
                    setError(null);
                    setIsOpen(false);
                    setIsMaximized(false);
                  }}
                  className="h-8 w-8 text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
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
                        className="max-w-full whitespace-normal break-words rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-left text-xs leading-5 text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
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
            </div>

            <form onSubmit={handleSubmit} className="shrink-0 border-t border-white/10 bg-[#0B1120] p-4">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(event) => {
                    setInput(event.target.value);
                    if (!isListening) {
                      voiceDraftBaseRef.current = event.target.value.trim();
                    }
                  }}
                  placeholder="Ask a saved question..."
                  className="h-11 border-white/10 bg-slate-900/80 text-white placeholder:text-slate-500"
                />
                <select
                  value={selectedLanguage}
                  onChange={(event) => setSelectedLanguage(event.target.value)}
                  disabled={isLoading || isListening}
                  className="h-11 rounded-xl border border-white/10 bg-slate-900/80 px-2 text-xs text-slate-200 outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Speech recognition language"
                >
                  {languageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {isListening ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={handleStopListening}
                    className="h-11 w-11 rounded-xl"
                    aria-label="Stop voice recording"
                  >
                    <Square className="h-4 w-4 fill-current" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={handleStartListening}
                    disabled={isLoading || !isSupported}
                    className="h-11 w-11 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50"
                    aria-label="Start voice recording"
                  >
                    <Mic className={`h-4 w-4 ${isListening ? 'animate-pulse text-rose-300' : ''}`} />
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="h-11 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 text-slate-950 hover:from-cyan-300 hover:to-blue-400"
                >
                  <SendHorizonal className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-500">
                  {isListening ? 'Listening...' : 'Voice typing available'}
                </span>
                {isListening ? (
                  <span className="flex items-center gap-2 text-rose-300">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-rose-300" />
                    Mic active
                  </span>
                ) : null}
              </div>
              {!isSupported ? (
                <p className="mt-2 text-xs text-amber-300">
                  Voice input is not supported in this browser. Try Chrome or Edge.
                </p>
              ) : null}
              {speechError ? (
                <p className="mt-2 text-xs text-rose-300">{speechError}</p>
              ) : null}
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button
          onClick={() => {
            setIsOpen(true);
            setIsMaximized(false);
          }}
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
