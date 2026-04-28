'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Send, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSpeechToText } from '@/hooks/useSpeechToText';

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInput({
  onSend,
  onStop,
  isLoading = false,
  disabled = false,
  placeholder = 'Type your message...',
  className,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
    { value: 'en-US', label: 'English' },
    { value: 'hi-IN', label: 'Hindi' },
    { value: 'es-ES', label: 'Spanish' },
  ];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isListening && !finalTranscript && !interimTranscript) {
      return;
    }

    const voiceText = [finalTranscript, interimTranscript].filter(Boolean).join(' ').trim();
    const nextValue = [voiceDraftBaseRef.current, voiceText].filter(Boolean).join(' ').trim();
    setMessage(nextValue);
  }, [finalTranscript, interimTranscript, isListening]);

  const handleSubmit = () => {
    if (message.trim() && !isLoading && !disabled) {
      onSend(message.trim());
      setMessage('');
      voiceDraftBaseRef.current = '';
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleStartListening = async () => {
    if (isListening || disabled || isLoading) {
      return;
    }

    voiceDraftBaseRef.current = message.trim();
    await startListening();
  };

  const handleStopListening = () => {
    const voiceText = [finalTranscript, interimTranscript].filter(Boolean).join(' ').trim();
    const nextValue = [voiceDraftBaseRef.current, voiceText].filter(Boolean).join(' ').trim();
    stopListening();

    if (nextValue && !speechError && !isLoading && !disabled) {
      onSend(nextValue);
      setMessage('');
      voiceDraftBaseRef.current = '';
    }
  };

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-end gap-2 bg-zinc-800 border border-zinc-700 rounded-2xl p-2 focus-within:border-zinc-600 transition-colors">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (!isListening) {
              voiceDraftBaseRef.current = e.target.value.trim();
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-white placeholder-zinc-500 resize-none outline-none px-2 py-2 text-sm leading-relaxed min-h-[40px] max-h-[200px]"
        />
        <select
          value={selectedLanguage}
          onChange={(event) => setSelectedLanguage(event.target.value)}
          disabled={disabled || isLoading || isListening}
          className="h-10 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-xs text-zinc-200 outline-none transition-colors focus:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
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
            size="icon"
            variant="destructive"
            onClick={handleStopListening}
            className="h-10 w-10 rounded-xl flex-shrink-0"
            aria-label="Stop voice recording"
          >
            <Square className="h-4 w-4 fill-current" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            onClick={handleStartListening}
            disabled={disabled || isLoading || !isSupported}
            className="h-10 w-10 rounded-xl flex-shrink-0 bg-zinc-700 text-white hover:bg-zinc-600 disabled:opacity-50"
            aria-label="Start voice recording"
          >
            <Mic className="h-4 w-4" />
          </Button>
        )}
        {isLoading ? (
          <Button
            type="button"
            size="icon"
            variant="destructive"
            onClick={onStop}
            className="h-10 w-10 rounded-xl flex-shrink-0"
          >
            <Square className="h-4 w-4 fill-current" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            onClick={handleSubmit}
            disabled={!message.trim() || disabled}
            className="h-10 w-10 rounded-xl flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="text-xs text-zinc-500">
          Press Enter to send, Shift + Enter for new line
        </p>
        {isListening ? (
          <div className="flex items-center gap-2 text-xs text-rose-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-rose-400" />
            Listening...
          </div>
        ) : null}
      </div>
      {!isSupported ? (
        <p className="mt-2 px-1 text-xs text-amber-400">
          Voice input is not supported in this browser. Try Chrome or Edge.
        </p>
      ) : null}
      {speechError ? (
        <p className="mt-2 px-1 text-xs text-rose-400">{speechError}</p>
      ) : null}
    </div>
  );
}
