'use client';

import { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ChatHistoryProps {
  messages: Message[];
  onRegenerate?: (messageId: string) => void;
  className?: string;
}

export function ChatHistory({ messages, onRegenerate, className }: ChatHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle the last assistant message regeneration
  const handleRegenerate = (messageId: string) => {
    onRegenerate?.(messageId);
  };

  if (messages.length === 0) {
    return (
      <div className={cn('flex-1 flex items-center justify-center', className)}>
        <div className="text-center px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">AI Chat Assistant</h2>
          <p className="text-zinc-400 max-w-md">
            Start a conversation with your AI assistant. Ask questions, get help with code, or explore ideas together.
          </p>
        </div>
      </div>
    );
  }

  // Find the last assistant message for regenerate functionality
  const lastAssistantIndex = messages.findLastIndex((m) => m.role === 'assistant');

  return (
    <div
      ref={containerRef}
      className={cn('flex-1 overflow-y-auto scroll-smooth', className)}
      style={{ overscrollBehavior: 'contain' }}
    >
      <div className="max-w-3xl mx-auto py-4 px-4">
        {messages.map((message, index) => (
          <ChatMessage
            key={message.id}
            message={message}
            onRegenerate={
              index === lastAssistantIndex && message.role === 'assistant'
                ? () => handleRegenerate(message.id)
                : undefined
            }
          />
        ))}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}
