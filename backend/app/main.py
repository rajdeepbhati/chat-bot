from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.config import get_settings
from app.database import Base, SessionLocal, engine
from app.routers.auth import router as auth_router
from app.routers.chatbot import router as chatbot_router
from app.routers.quiz_generator import router as quiz_generator_router
from app.routers.study_corner import router as study_corner_router
from app.routers.users import router as users_router
from app.schemas import HealthResponse
from app.seed import seed_chatbot_data, seed_demo_users

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_demo_users(db)
        seed_chatbot_data(db)
    finally:
        db.close()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(chatbot_router)
app.include_router(study_corner_router)
app.include_router(quiz_generator_router)


@app.get("/", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(status="ok", app=settings.app_name)
