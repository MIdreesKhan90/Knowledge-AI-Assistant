from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi.middleware.cors import CORSMiddleware

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.database import Base, engine, get_db
from app.core.limiter import limiter

# Models
from app.models.user import User
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.knowledge_base import KnowledgeBase

# Routers
from app.routers.auth import router as auth_router
from app.routers.documents import router as documents_router
from app.routers.chat import router as chat_router
from app.routers.knowledge_bases import router as knowledge_bases_router
from app.routers.analytics import router as analytics_router
from app.routers import admin


# FastAPI Application
app = FastAPI(
    title="KnowledgeAI API",
    description="AI-powered Knowledge Assistant API",
    version="1.0.0"
)


# Rate Limiter Configuration
app.state.limiter = limiter

app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler
)

app.add_middleware(SlowAPIMiddleware)


# Database Tables
Base.metadata.create_all(bind=engine)


# Register API Routers
app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(chat_router)
app.include_router(knowledge_bases_router)
app.include_router(analytics_router)
app.include_router(admin.router)


# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Root Endpoint
@app.get("/")
def root():
    return {
        "message": "Welcome to KnowledgeAI API",
        "status": "running"
    }


# Health Check
@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


# Database Connection Check
@app.get("/database-check")
def database_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))

        return {
            "status": "success",
            "message": "PostgreSQL connected successfully!"
        }

    except Exception:
        return {
            "status": "error",
            "message": "Database connection failed"
        }