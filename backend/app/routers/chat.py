from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.knowledge_base import KnowledgeBase

from app.routers.documents import get_current_user

from app.services.rag_service import (
    retrieve_context,
    generate_rag_answer
)


router = APIRouter(
    prefix="/chat",
    tags=["AI Chat"]
)


# ==========================================
# REQUEST VALIDATION SCHEMAS
# ==========================================

class ChatRequest(BaseModel):
    question: str = Field(
        min_length=1,
        max_length=5000
    )

    conversation_id: int = Field(gt=0)

    knowledge_base_id: int | None = Field(
        default=None,
        gt=0
    )

    @field_validator("question")
    @classmethod
    def validate_question(cls, value):
        value = value.strip()

        if not value:
            raise ValueError("Question cannot be empty")

        return value


class RenameConversationRequest(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=255
    )

    @field_validator("title")
    @classmethod
    def validate_title(cls, value):
        value = value.strip()

        if not value:
            raise ValueError("Title cannot be empty")

        return value


# ==========================================
# CREATE CONVERSATION
# ==========================================

@router.post("/conversations")
def create_conversation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        conversation = Conversation(
            user_id=current_user.id,
            title="New Chat"
        )

        db.add(conversation)
        db.commit()
        db.refresh(conversation)

        return {
            "id": conversation.id,
            "title": conversation.title,
            "created_at": conversation.created_at,
            "updated_at": conversation.updated_at
        }

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to create conversation"
        )


# ==========================================
# GET USER CONVERSATIONS
# ==========================================

@router.get("/conversations")
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversations = (
        db.query(Conversation)
        .filter(
            Conversation.user_id == current_user.id
        )
        .order_by(
            Conversation.updated_at.desc()
        )
        .all()
    )

    return [
        {
            "id": conversation.id,
            "title": conversation.title,
            "created_at": conversation.created_at,
            "updated_at": conversation.updated_at
        }
        for conversation in conversations
    ]


# ==========================================
# GET CONVERSATION MESSAGES
# ==========================================

@router.get("/conversations/{conversation_id}/messages")
def get_conversation_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if conversation_id <= 0:
        raise HTTPException(
            status_code=422,
            detail="Invalid conversation ID"
        )

    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
        )
        .first()
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found"
        )

    messages = (
        db.query(Message)
        .filter(
            Message.conversation_id == conversation_id,
            Message.user_id == current_user.id
        )
        .order_by(Message.created_at.asc())
        .all()
    )

    return [
        {
            "id": message.id,
            "role": message.role,
            "content": message.content,
            "sources": message.sources,
            "created_at": message.created_at
        }
        for message in messages
    ]


# ==========================================
# RENAME CONVERSATION
# ==========================================

@router.patch("/conversations/{conversation_id}")
def rename_conversation(
    conversation_id: int,
    request: RenameConversationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
        )
        .first()
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found"
        )

    conversation.title = request.title
    conversation.updated_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(conversation)

        return {
            "id": conversation.id,
            "title": conversation.title,
            "updated_at": conversation.updated_at
        }

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to rename conversation"
        )


# ==========================================
# DELETE CONVERSATION
# ==========================================

@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id
        )
        .first()
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found"
        )

    try:
        db.delete(conversation)
        db.commit()

        return {
            "message": "Conversation deleted successfully",
            "conversation_id": conversation_id
        }

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to delete conversation"
        )


# ==========================================
# ASK AI
# ==========================================

@router.post("/ask")
def ask_question(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Verify conversation ownership
        conversation = (
            db.query(Conversation)
            .filter(
                Conversation.id == request.conversation_id,
                Conversation.user_id == current_user.id
            )
            .first()
        )

        if not conversation:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found"
            )

        # Verify Knowledge Base ownership
        if request.knowledge_base_id is not None:

            knowledge_base = (
                db.query(KnowledgeBase)
                .filter(
                    KnowledgeBase.id == request.knowledge_base_id,
                    KnowledgeBase.user_id == current_user.id
                )
                .first()
            )

            if not knowledge_base:
                raise HTTPException(
                    status_code=404,
                    detail="Knowledge Base not found"
                )

        # Save user message
        user_message = Message(
            conversation_id=conversation.id,
            user_id=current_user.id,
            role="user",
            content=request.question
        )

        db.add(user_message)

        # Set conversation title from first question
        if conversation.title == "New Chat":
            conversation.title = request.question[:60]

        conversation.updated_at = datetime.now(timezone.utc)

        db.commit()

        # Retrieve user-specific document context
        retrieved = retrieve_context(
            db=db,
            query=request.question,
            user_id=current_user.id,
            top_k=5,
            knowledge_base_id=request.knowledge_base_id
        )

        # Generate answer
        if not retrieved["context"]:

            answer = (
                "I couldn't find relevant information "
                "in your documents."
            )

            sources = []

        else:

            answer = generate_rag_answer(
                question=request.question,
                context=retrieved["context"]
            )

            sources = [
                {
                    "document_id": source["document_id"],
                    "filename": source["metadata"]["filename"],
                    "chunk_index": source["chunk_index"],
                    "distance": source["distance"]
                }
                for source in retrieved["sources"]
            ]

        # Save assistant response
        assistant_message = Message(
            conversation_id=conversation.id,
            user_id=current_user.id,
            role="assistant",
            content=answer,
            sources=sources
        )

        db.add(assistant_message)

        conversation.updated_at = datetime.now(timezone.utc)

        db.commit()

        return {
            "conversation_id": conversation.id,
            "question": request.question,
            "knowledge_base_id": request.knowledge_base_id,
            "answer": answer,
            "total_sources": len(sources),
            "sources": sources
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "An internal error occurred "
                "while processing your request."
            )
        )