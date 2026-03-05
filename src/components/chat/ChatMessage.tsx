'use client';

import { memo, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import { CodeBlock } from './CodeBlock';
import { MathBlock } from './MathBlock';
import { MermaidBlock } from './MermaidBlock';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, Copy, RotateCcw, User, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@/lib/types';

interface ChatMessageProps {
  message: Message;
  onRegenerate?: () => void;
  onCopy?: () => void;
}

// Custom component for code blocks
const CodeComponent = ({ inline, className, children, ...props }: {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const code = String(children).replace(/\n$/, '');

  // Handle mermaid diagrams
  if (language === 'mermaid') {
    return <MermaidBlock code={code} />;
  }

  // Handle regular code blocks
  if (!inline && (language || code.includes('\n'))) {
    return <CodeBlock code={code} language={language} />;
  }

  // Handle inline code
  return (
    <code
      className="px-1.5 py-0.5 rounded bg-zinc-700/50 text-sm font-mono text-emerald-400"
      {...props}
    >
      {children}
    </code>
  );
};

// Helper function to extract latex from children
function extractLatexFromChildren(children: React.ReactNode): string {
  if (typeof children === 'string') {
    return children;
  }
  if (Array.isArray(children)) {
    return children.map(extractLatexFromChildren).join('');
  }
  if (children && typeof children === 'object' && 'props' in children) {
    return extractLatexFromChildren((children as React.ReactElement).props.children);
  }
  return '';
}

export const ChatMessage = memo(function ChatMessage({ message, onRegenerate, onCopy }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 2000);
  };

  // Custom components for markdown rendering
  const components = useMemo(() => ({
    code: CodeComponent,
    // Handle block math $$...$$
    div: ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
      if (className?.includes('math-display')) {
        const latex = extractLatexFromChildren(children);
        return <MathBlock latex={latex} isInline={false} />;
      }
      return <div className={className} {...props}>{children}</div>;
    },
    // Handle inline math $...$
    span: ({ className, children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
      if (className?.includes('math-inline')) {
        const latex = extractLatexFromChildren(children);
        return <MathBlock latex={latex} isInline={true} />;
      }
      return <span className={className} {...props}>{children}</span>;
    },
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p className="mb-3 last:mb-0 leading-relaxed" {...props}>
        {children}
      </p>
    ),
    ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
      <ul className="mb-3 list-disc list-outside ml-4 space-y-1" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
      <ol className="mb-3 list-decimal list-outside ml-4 space-y-1" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
      <li className="leading-relaxed" {...props}>
        {children}
      </li>
    ),
    a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 underline"
        {...props}
      >
        {children}
      </a>
    ),
    blockquote: ({ children, ...props }: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) => (
      <blockquote
        className="border-l-4 border-zinc-600 pl-4 py-2 my-3 bg-zinc-800/50 rounded-r"
        {...props}
      >
        {children}
      </blockquote>
    ),
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h2 className="text-xl font-bold mb-3 mt-5 first:mt-0" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h3 className="text-lg font-semibold mb-2 mt-4 first:mt-0" {...props}>
        {children}
      </h3>
    ),
    table: ({ children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
      <div className="overflow-x-auto my-3">
        <table className="min-w-full border-collapse" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
      <thead className="bg-zinc-800" {...props}>{children}</thead>
    ),
    th: ({ children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
      <th className="border border-zinc-700 px-4 py-2 text-left font-semibold" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
      <td className="border border-zinc-700 px-4 py-2" {...props}>
        {children}
      </td>
    ),
  }), []);

  return (
    <div
      className={cn(
        'group flex gap-4 p-4',
        isUser && 'bg-zinc-800/30'
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <Avatar className="h-8 w-8 bg-blue-600">
            <AvatarFallback className="bg-blue-600 text-white">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        ) : (
          <Avatar className="h-8 w-8 bg-emerald-600">
            <AvatarFallback className="bg-emerald-600 text-white">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm">
            {isUser ? 'You' : 'Assistant'}
          </span>
          {message.isStreaming && (
            <Sparkles className="h-3 w-3 animate-pulse text-emerald-400" />
          )}
        </div>
        
        <div className="prose prose-invert max-w-none text-sm">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeRaw]}
            components={components}
          >
            {message.content}
          </ReactMarkdown>
          
          {/* Loading indicator for empty assistant messages */}
          {isAssistant && message.isStreaming && !message.content && (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="h-2 w-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="h-2 w-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>

        {/* Action buttons */}
        {isAssistant && !message.isStreaming && message.content && (
          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2 text-zinc-400 hover:text-zinc-200"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 mr-1" />
              ) : (
                <Copy className="h-3.5 w-3.5 mr-1" />
              )}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            {onRegenerate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRegenerate}
                className="h-7 px-2 text-zinc-400 hover:text-zinc-200"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Regenerate
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
