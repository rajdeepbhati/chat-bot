'use client';

import { useState, useCallback } from 'react';
import { ChatHistory } from '@/components/chat/ChatHistory';
import { ChatInput } from '@/components/chat/ChatInput';
import { Button } from '@/components/ui/button';
import { Trash2, Download, Sparkles, BellRing, MessageSquareQuote } from 'lucide-react';
import type { Message } from '@/lib/types';

const EXAMPLE_PROMPTS = [
  {
    id: 'review',
    icon: BellRing,
    title: 'Mid-Sem Review',
    prompt: 'Mid-Semester Review',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'lab',
    icon: MessageSquareQuote,
    title: 'Lab Schedule',
    prompt: 'Database Lab Schedule',
    gradient: 'from-emerald-500 to-teal-500',
  },
];

const generateId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (userMessage: string) => {
    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    const assistantMsg: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);

    try {
      const apiMessages = [...messages, userMsg]
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.content || '';

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content, isStreaming: false }
            : m
        )
      );
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, isStreaming: false, content: `Error: ${(error as Error).message}` }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const handleStop = useCallback(() => {
  }, []);

  const handleRegenerate = useCallback(async (messageId: string) => {
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1 || messages[messageIndex].role !== 'assistant') return;

    const userMessageIndex = messageIndex - 1;
    if (userMessageIndex < 0 || messages[userMessageIndex].role !== 'user') return;

    const messagesToKeep = messages.slice(0, messageIndex);

    setMessages(messagesToKeep);
    setIsLoading(true);

    try {
      const apiMessages = messagesToKeep
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.content || '';

      const assistantMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content,
        timestamp: new Date(),
        isStreaming: false,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Regenerate error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const handleClear = useCallback(() => {
    if (messages.length > 0) {
      setMessages([]);
    }
  }, [messages]);

  const handleExport = useCallback(() => {
    const markdown = messages
      .map((m) => {
        const role = m.role === 'user' ? 'You' : 'Assistant';
        return `## ${role}\n\n${m.content}\n\n---\n`;
      })
      .join('\n');

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [messages]);

  return (
    <div className="flex h-screen flex-col bg-zinc-900">
      <header className="flex-shrink-0 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/60">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-white">Campus AI Assistant</h1>
          </div>

          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-zinc-400 hover:text-white"
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Clear
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExport}
                  className="text-zinc-400 hover:text-white"
                >
                  <Download className="mr-1 h-4 w-4" />
                  Export
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto p-4">
          <div className="w-full max-w-2xl space-y-6">
            <div className="space-y-2 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Campus AI Assistant</h2>
              <p className="text-zinc-400">
                Ask a saved announcement question or try one of these examples.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {EXAMPLE_PROMPTS.map((example) => {
                const Icon = example.icon;
                return (
                  <button
                    key={example.id}
                    onClick={() => sendMessage(example.prompt)}
                    disabled={isLoading}
                    className="group flex items-start gap-3 rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4 text-left transition-all hover:border-zinc-600 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${example.gradient}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white transition-colors group-hover:text-emerald-400">
                        {example.title}
                      </h3>
                      <p className="mt-0.5 line-clamp-2 text-sm text-zinc-400">{example.prompt}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 text-center">
              <p className="text-xs text-zinc-500">
                Replies come only from saved Manage Announcements entries.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <ChatHistory
          messages={messages}
          onRegenerate={handleRegenerate}
          className="flex-1"
        />
      )}

      <div className="flex-shrink-0 border-t border-zinc-800 bg-zinc-900 p-4">
        <div className="mx-auto max-w-3xl">
          <ChatInput
            onSend={sendMessage}
            onStop={handleStop}
            isLoading={isLoading}
            placeholder="Ask a saved announcement question..."
          />
        </div>
      </div>
    </div>
  );
}
