'use client';

import { useState, useCallback } from 'react';
import { ChatHistory } from '@/components/chat/ChatHistory';
import { ChatInput } from '@/components/chat/ChatInput';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Trash2, Download, MoreHorizontal, Sparkles, GitBranch, Calculator, Code, Lightbulb } from 'lucide-react';
import type { Message } from '@/lib/types';

// Example prompts for quick actions
const EXAMPLE_PROMPTS = [
  {
    id: 'mermaid',
    icon: GitBranch,
    title: 'Generate a Flowchart',
    prompt: 'Create a Mermaid flowchart showing the software development lifecycle with phases: Requirements, Design, Development, Testing, Deployment, and Maintenance. Show the flow between these phases.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'math',
    icon: Calculator,
    title: 'Math Formulas',
    prompt: 'Explain and show the quadratic formula, the Pythagorean theorem, and Euler\'s identity using LaTeX math notation. Include both inline and block math examples.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'code',
    icon: Code,
    title: 'Code Example',
    prompt: 'Write a Python function that implements the quicksort algorithm with detailed comments explaining each step. Include a usage example.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'knowledge',
    icon: Lightbulb,
    title: 'Fun Facts',
    prompt: 'Tell me 5 mind-blowing facts about the universe that most people don\'t know. Make each fact interesting and educational.',
    gradient: 'from-orange-500 to-amber-500',
  },
];

// Generate unique ID
const generateId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Send message to API and handle response
  const sendMessage = useCallback(async (userMessage: string) => {
    // Add user message
    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    // Create assistant message placeholder
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
      // Prepare messages for API (only user and assistant messages)
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

      // Update the assistant message with the response
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

  // Stop generation (no-op for non-streaming)
  const handleStop = useCallback(() => {
    // Nothing to stop in non-streaming mode
  }, []);

  // Regenerate response
  const handleRegenerate = useCallback(async (messageId: string) => {
    // Find the message index
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1 || messages[messageIndex].role !== 'assistant') return;

    // Find the preceding user message
    const userMessageIndex = messageIndex - 1;
    if (userMessageIndex < 0 || messages[userMessageIndex].role !== 'user') return;

    // Get messages up to and including the user message
    const messagesToKeep = messages.slice(0, messageIndex);
    const userMessage = messages[userMessageIndex];

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

      // Add assistant message with the response
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

  // Clear chat
  const handleClear = useCallback(() => {
    if (messages.length > 0) {
      setMessages([]);
    }
  }, [messages]);

  // Export chat as Markdown
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
    <div className="flex flex-col h-screen bg-zinc-900">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/60">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-white">AI Chat</h1>
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
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExport}
                  className="text-zinc-400 hover:text-white"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Chat History or Welcome Screen */}
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full space-y-6">
            {/* Welcome Message */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Welcome to AI Chat</h2>
              <p className="text-zinc-400">
                Ask anything or try one of these examples to see what I can do!
              </p>
            </div>

            {/* Example Prompts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
              {EXAMPLE_PROMPTS.map((example) => {
                const Icon = example.icon;
                return (
                  <button
                    key={example.id}
                    onClick={() => sendMessage(example.prompt)}
                    disabled={isLoading}
                    className="group flex items-start gap-3 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600 hover:bg-zinc-800 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${example.gradient} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                        {example.title}
                      </h3>
                      <p className="text-sm text-zinc-400 line-clamp-2 mt-0.5">
                        {example.prompt.slice(0, 60)}...
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Features hint */}
            <div className="text-center pt-4">
              <p className="text-xs text-zinc-500">
                ✨ Supports Markdown, LaTeX math, code highlighting & Mermaid diagrams
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

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-zinc-800 bg-zinc-900 p-4">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            onSend={sendMessage}
            onStop={handleStop}
            isLoading={isLoading}
            placeholder="Send a message..."
          />
        </div>
      </div>
    </div>
  );
}
