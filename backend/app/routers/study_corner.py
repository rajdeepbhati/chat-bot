from fastapi import APIRouter

from app.schemas import StudyCornerRequest, StudyCornerResponse
from app.services.study_corner import generate_study_corner

router = APIRouter(prefix="/study-corner", tags=["AI Study Corner"])


@router.post("/generate", response_model=StudyCornerResponse)
async def generate_topic(payload: StudyCornerRequest) -> StudyCornerResponse:
    return await generate_study_corner(payload.topic)
