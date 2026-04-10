# Agents Guidance

## Stack

- **Frontend**: Next.js 16 + React 19, uses `@/*` alias pointing to `src/*`
- **Backend**: FastAPI in `backend/` (separate Python app)
- **Package manager**: Bun (not npm)
- **AI Chat**: Z.ai GLM-4.5-flash via `src/app/api/chat/route.ts`

## Key Commands

```bash
bun run dev          # Start frontend (port 3000)
bun run build        # Build standalone Next.js app
bun start            # Run production server
bun run lint         # Lint frontend
bun run db:push      # Push Prisma schema (uses SQLite by default)
```

**Backend** (run separately):
```bash
cd backend && .venv\Scripts\activate && uvicorn app.main:app --reload
# Swagger docs: http://127.0.0.1:8000/docs
```

**Both at once**:
```bash
npm run backend:dev  # Backend in new window
npm run frontend:dev # Frontend
```

## Architecture

- **Frontend entry**: `src/app/page.tsx` (login), `src/app/student/dashboard/page.tsx`, etc.
- **Chat API**: `src/app/api/chat/route.ts` - streams responses from Z.ai API
- **Backend routers**: `backend/app/routers/` (auth, chatbot, quiz_generator, etc.)
- **Chat components**: `src/components/chat/` (ChatMessage, ChatInput, CodeBlock, MathBlock, MermaidBlock)

## Env Setup

Frontend needs `.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

Backend needs `backend/.env` with `DATABASE_URL`, `JWT_SECRET_KEY`, and AI provider config.

## Gotchas

- `src/app/api/chat/route.ts` contains hardcoded API key - move to env before production
- Backend uses SQLAlchemy (not Prisma) for main data - Prisma schema exists but isn't integrated with chat
- `next.config.ts`: `typescript.ignoreBuildErrors: true` and `reactStrictMode: false`
- Backend API key for Z.ai stored inline in the chat route file

## Testing

```bash
cd backend && python scripts\smoke_test.py  # Backend smoke test
npx eslint src                               # Frontend lint
```

## More Info

See `SMART_CAMPUS_OS_SETUP.md` for full feature map and `CLAUDE.md` for framework conventions.
