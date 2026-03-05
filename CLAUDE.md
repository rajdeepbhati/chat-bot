# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A modern AI chatbot interface built with Next.js 16, featuring streaming responses, code highlighting, LaTeX math rendering, and Mermaid diagram support. Uses Z.ai's GLM-4.5-flash model via API.

## Development Commands

```bash
# Start development server (port 3000)
bun run dev

# Build for production (standalone output mode)
bun run build

# Run production server
bun start

# Lint code
bun run lint

# Database operations
bun run db:push      # Push schema changes without migration
bun run db:generate  # Generate Prisma client
bun run db:migrate   # Create and run migrations
bun run db:reset     # Reset database
```

## Architecture

### Directory Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with fonts, Toaster
│   ├── page.tsx            # Main chat interface (client component)
│   └── api/chat/route.ts   # Streaming chat API endpoint
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── chat/
│       ├── ChatMessage.tsx # Individual message rendering with markdown
│       ├── ChatHistory.tsx # Message list with regenerate
│       ├── ChatInput.tsx   # Input form with stop/send
│       ├── CodeBlock.tsx   # Syntax-highlighted code
│       ├── MathBlock.tsx   # LaTeX rendering
│       └── MermaidBlock.tsx# Mermaid diagram rendering
├── hooks/                  # Custom React hooks
├── lib/
│   ├── db.ts              # Prisma client singleton
│   ├── types.ts           # TypeScript interfaces
│   └── utils.ts           # Utility functions
```

### Key Technologies

- **Framework**: Next.js 16 (App Router), React 19
- **Language**: TypeScript with `@/*` path alias pointing to `src/*`
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Markdown**: react-markdown with remark-gfm, remark-math, rehype-raw
- **Code**: react-syntax-highlighter
- **Math**: KaTeX
- **Diagrams**: Mermaid
- **Database**: Prisma with SQLite (not currently used by chat)

### Chat Flow

1. User sends message from `ChatInput` → `sendMessage()` in `page.tsx`
2. POST to `/api/chat/route.ts` with messages array
3. API forwards to Z.ai API (`https://api.z.ai/api/paas/v4/chat/completions`)
4. Response streamed via Server-Sent Events (SSE) format: `data: {content: "..."}`
5. Client reads stream and updates message content incrementally
6. Messages rendered with full markdown/code/math/diagram support

### Message Type

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}
```

### API Configuration

The API key and endpoint are configured in `/src/app/api/chat/route.ts`:
- Model: `glm-4.5-flash`
- Temperature: `1.0`

## Build Configuration

- **Output mode**: `standalone` (for containerized deployments)
- **TypeScript**: `ignoreBuildErrors: true` (temporary - fix actual errors when encountered)
- **React Strict Mode**: `false`

## Database (Prisma)

Current schema has `User` and `Post` models but they are not integrated with the chat functionality. Database operations use a singleton pattern in `src/lib/db.ts`.
