from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import ChatbotAskRequest, ChatbotAskResponse
from app.services.chatbot import generate_grounded_answer

router = APIRouter(prefix="/chatbot", tags=["AI Chatbot"])


@router.post("/ask", response_model=ChatbotAskResponse)
async def ask_chatbot(
    payload: ChatbotAskRequest,
    db: Session = Depends(get_db),
) -> ChatbotAskResponse:
    answer, provider, context_lines, target_date = await generate_grounded_answer(
        question=payload.question,
        db=db,
        provider_override=payload.provider,
    )
    return ChatbotAskResponse(
        answer=answer,
        provider=provider,
        grounded_date=target_date.isoformat() if target_date else None,
        context_summary=context_lines,
    )
