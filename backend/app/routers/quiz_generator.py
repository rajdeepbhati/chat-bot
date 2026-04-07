from fastapi import APIRouter

from app.schemas import QuizGeneratorRequest, QuizGeneratorResponse
from app.services.quiz_generator import generate_quiz

router = APIRouter(prefix="/quiz-generator", tags=["AI Quiz Generator"])


@router.post("/generate", response_model=QuizGeneratorResponse)
async def generate_topic_quiz(payload: QuizGeneratorRequest) -> QuizGeneratorResponse:
    return await generate_quiz(payload.topic)
