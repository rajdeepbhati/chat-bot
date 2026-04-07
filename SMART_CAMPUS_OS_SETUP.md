# Smart Campus OS

## Stack

- Frontend: React.js with Next.js App Router
- Backend: FastAPI
- Database: MySQL via SQLAlchemy
- AI: OpenAI and Gemini-ready backend services

## Current Folder Structure

```text
chat-bot/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── panel/page.tsx
│   │   ├── api/
│   │   │   └── chat/route.ts
│   │   ├── chat/page.tsx
│   │   ├── faculty/
│   │   │   └── portal/page.tsx
│   │   ├── student/
│   │   │   └── dashboard/page.tsx
│   │   ├── study-corner/page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── chat/
│   │   │   └── FloatingChatbot.tsx
│   │   └── ui/
│   └── lib/
│       └── auth.ts
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── chatbot.py
│   │   │   ├── quiz_generator.py
│   │   │   ├── study_corner.py
│   │   │   └── users.py
│   │   ├── services/
│   │   │   ├── announcement_ingest.py
│   │   │   ├── at_risk.py
│   │   │   ├── chatbot.py
│   │   │   ├── event_intake.py
│   │   │   ├── quiz_generator.py
│   │   │   ├── report_card.py
│   │   │   └── study_corner.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── seed.py
│   ├── scripts/
│   │   └── smoke_test.py
│   ├── .env.example
│   ├── README.md
│   └── requirements.txt
├── .env.example
├── package.json
└── SMART_CAMPUS_OS_SETUP.md
```

## Modules Already Present

- Student Dashboard
- Faculty Portal
- Admin Panel
- AI Chatbot
- AI Study Corner
- AI Quiz Generator
- PDF Report Cards
- At-risk student analytics
- Announcement text ingestion for chatbot grounding
- Floating chatbot UI

## Frontend Entry Points

- Login page: `src/app/page.tsx`
- Student Dashboard: `src/app/student/dashboard/page.tsx`
- Faculty Portal: `src/app/faculty/portal/page.tsx`
- Admin Panel: `src/app/admin/panel/page.tsx`
- AI Study Corner: `src/app/study-corner/page.tsx`
- Full chat page: `src/app/chat/page.tsx`
- Floating chatbot: `src/components/chat/FloatingChatbot.tsx`

## Backend API Areas

- Auth and JWT: `backend/app/routers/auth.py`
- Role-based app data: `backend/app/routers/users.py`
- AI chatbot: `backend/app/routers/chatbot.py`
- AI Study Corner: `backend/app/routers/study_corner.py`
- Quiz Generator: `backend/app/routers/quiz_generator.py`

## Step-by-Step Setup

### 1. Frontend install

From project root:

```bash
npm install
```

### 2. Frontend environment

Create `.env.local` in project root:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

### 3. Backend virtual environment

From `backend/`:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Backend environment

Copy:

```bash
copy .env.example .env
```

Update `backend/.env` for MySQL:

```env
DATABASE_URL=mysql+pymysql://root:yourpassword@localhost:3306/eduflow
JWT_SECRET_KEY=change-this-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4.1-mini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

### 5. Create MySQL database

In MySQL:

```sql
CREATE DATABASE eduflow;
```

### 6. Start backend

From `backend/`:

```bash
uvicorn app.main:app --reload
```

Swagger docs:

```text
http://127.0.0.1:8000/docs
```

### 7. Start frontend

From project root:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Demo Accounts

- Admin: `admin@eduflow.ai` / `Admin@123`
- Faculty: `faculty@eduflow.ai` / `Faculty@123`
- Student: `student@eduflow.ai` / `Student@123`

## Main Feature Map

### Student Dashboard

- Today’s timetable
- Assignment list
- Attendance summary
- Marks overview

Frontend:

- `src/app/student/dashboard/page.tsx`

Backend:

- `GET /student/dashboard`

### Faculty Portal

- View students
- Mark attendance
- Enter marks

Frontend:

- `src/app/faculty/portal/page.tsx`

Backend:

- `GET /faculty/portal`
- `POST /faculty/attendance`
- `POST /faculty/marks`

### Admin Panel

- Add/Edit/Delete students
- Add/Edit/Delete faculty
- Manage announcements

Frontend:

- `src/app/admin/panel/page.tsx`

Backend:

- `GET /admin/panel`
- `POST /admin/students`
- `PUT /admin/students/{id}`
- `DELETE /admin/students/{id}`
- `POST /admin/faculty`
- `PUT /admin/faculty/{id}`
- `DELETE /admin/faculty/{id}`
- `POST /admin/announcements`
- `PUT /admin/announcements/{id}`
- `DELETE /admin/announcements/{id}`

### AI Chatbot

- SQL-grounded question answering
- Uses campus day and announcement data

Backend:

- `POST /chatbot/ask`

### AI Study Corner

- Topic input
- Easy explanation
- Real-life analogy
- Important questions

Frontend:

- `src/app/study-corner/page.tsx`

Backend:

- `POST /study-corner/generate`

### Quiz Generator

- Topic input
- 10 MCQs with answers

Backend:

- `POST /quiz-generator/generate`

### PDF Reports

- Marks
- Attendance
- AI performance summary

Backend:

- `GET /reports/student-report-card/{student_id}`

### At-Risk Students

- Detect low attendance
- Detect low marks
- AI feedback per student

Backend:

- `GET /reports/at-risk-students`

### Admin Natural-Language Announcements

- Example: `College closed on March 20`
- Stored in SQL tables
- Used by chatbot

Backend:

- `POST /admin/announcements/ingest-text`

### Admin Event Intake with AI Follow-ups

- AI asks missing details
- Example follow-ups:
  - Dress code?
  - Timing?
  - Location?

Backend:

- `POST /admin/events/intake`

## Important Notes

### MySQL

This backend is already compatible with MySQL through SQLAlchemy and `PyMySQL`.
Use a MySQL `DATABASE_URL` in `backend/.env`.

### OpenAI

The following AI features need `OPENAI_API_KEY`:

- Study Corner
- Quiz Generator
- At-risk feedback messages
- Event intake follow-up generation
- AI performance summary in PDF reports
- Chatbot when `AI_PROVIDER=openai`

### Existing Next API chat route

`src/app/api/chat/route.ts` currently still contains a hardcoded external API key and should be moved to environment variables before production.

## Recommended Next Improvements

- Move all demo in-memory records in `backend/app/routers/users.py` into real SQLAlchemy tables
- Add Alembic migrations
- Connect the quiz generator to a dedicated React page
- Connect admin event intake to the Admin Panel UI
- Connect report-card downloads to Faculty and Admin screens
- Replace the hardcoded Next.js chat API key with env-based config

## Useful Commands

Frontend lint:

```bash
npx eslint src
```

Backend smoke test:

```bash
cd backend
python scripts\smoke_test.py
```
