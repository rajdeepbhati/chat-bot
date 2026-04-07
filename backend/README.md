# EduFlow FastAPI Backend

## Run locally

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

The API starts at `http://127.0.0.1:8000` and Swagger UI is available at `/docs`.

Use:

- `POST /auth/login` for JSON login
- `POST /auth/token` for Swagger and OAuth2-compatible form login
- `POST /chatbot/ask` for SQL-grounded AI chatbot answers
- `POST /study-corner/generate` for topic summaries
- `POST /quiz-generator/generate` for AI-generated MCQ quizzes

## Seeded demo accounts

- `admin@eduflow.ai` / `Admin@123`
- `faculty@eduflow.ai` / `Faculty@123`
- `student@eduflow.ai` / `Student@123`

## Production note

Set `DATABASE_URL` to PostgreSQL or MySQL before deployment. Example PostgreSQL DSN:

```env
DATABASE_URL=postgresql+psycopg://postgres:password@localhost:5432/eduflow
```

## Chatbot flow

`POST /chatbot/ask`

Example request:

```json
{
  "question": "Is college open tomorrow?",
  "provider": "openai"
}
```

The backend flow is:

1. Read relevant rows from SQL tables such as `campus_days` and `campus_announcements`
2. Build a grounded prompt from those facts
3. Send the prompt to OpenAI or Gemini
4. Return the generated answer plus the SQL context summary

## Quiz Generator

`POST /quiz-generator/generate`

Example request:

```json
{
  "topic": "Photosynthesis"
}
```

Example response shape:

```json
{
  "topic": "Photosynthesis",
  "questions": [
    {
      "question": "What is the main pigment used in photosynthesis?",
      "options": ["Chlorophyll", "Hemoglobin", "Keratin", "Melanin"],
      "answer": "Chlorophyll"
    }
  ]
}
```
