
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, timedelta

from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.conversation import Conversation
from app.models.message import Message
from app.routers.documents import get_current_user
from app.core.permissions import get_current_admin


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


@router.get("/overview")
def get_analytics_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_id = current_user.id

    # Total documents
    total_documents = (
        db.query(func.count(Document.id))
        .filter(Document.user_id == user_id)
        .scalar()
    )

    # Total conversations
    total_conversations = (
        db.query(func.count(Conversation.id))
        .filter(Conversation.user_id == user_id)
        .scalar()
    )

    # Total messages
    total_messages = (
        db.query(func.count(Message.id))
        .filter(Message.user_id == user_id)
        .scalar()
    )

    # User messages
    total_user_messages = (
        db.query(func.count(Message.id))
        .filter(
            Message.user_id == user_id,
            Message.role == "user"
        )
        .scalar()
    )

    # AI responses
    total_ai_responses = (
        db.query(func.count(Message.id))
        .filter(
            Message.user_id == user_id,
            Message.role == "assistant"
        )
        .scalar()
    )

    # Last 7 days message activity
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=6)

    daily_activity = (
        db.query(
            func.date(Message.created_at).label("date"),
            func.count(Message.id).label("total")
        )
        .filter(
            Message.user_id == user_id,
            Message.created_at >= seven_days_ago
        )
        .group_by(func.date(Message.created_at))
        .order_by(func.date(Message.created_at))
        .all()
    )

    return {
        "total_documents": total_documents or 0,
        "total_conversations": total_conversations or 0,
        "total_messages": total_messages or 0,
        "total_user_messages": total_user_messages or 0,
        "total_ai_responses": total_ai_responses or 0,
        "daily_activity": [
            {
                "date": str(item.date),
                "total": item.total
            }
            for item in daily_activity
        ]
    }


@router.get("/admin-overview")
def get_admin_analytics(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    # User statistics
    total_users = db.query(func.count(User.id)).scalar() or 0

    active_users = (
        db.query(func.count(User.id))
        .filter(User.is_active == True)
        .scalar() or 0
    )

    inactive_users = (
        db.query(func.count(User.id))
        .filter(User.is_active == False)
        .scalar() or 0
    )

    admin_users = (
        db.query(func.count(User.id))
        .filter(User.role == "admin")
        .scalar() or 0
    )

    # Platform-wide document statistics
    total_documents = (
        db.query(func.count(Document.id)).scalar() or 0
    )

    # Platform-wide conversation statistics
    total_conversations = (
        db.query(func.count(Conversation.id)).scalar() or 0
    )

    # Platform-wide message statistics
    total_messages = (
        db.query(func.count(Message.id)).scalar() or 0
    )

    total_ai_responses = (
        db.query(func.count(Message.id))
        .filter(Message.role == "assistant")
        .scalar() or 0
    )

    # Last 7 days platform activity
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=6)

    daily_activity = (
        db.query(
            func.date(Message.created_at).label("date"),
            func.count(Message.id).label("total")
        )
        .filter(Message.created_at >= seven_days_ago)
        .group_by(func.date(Message.created_at))
        .order_by(func.date(Message.created_at))
        .all()
    )

    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": inactive_users,
        "admin_users": admin_users,
        "total_documents": total_documents,
        "total_conversations": total_conversations,
        "total_messages": total_messages,
        "total_ai_responses": total_ai_responses,
        "daily_activity": [
            {
                "date": str(item.date),
                "total": item.total
            }
            for item in daily_activity
        ]
    }
