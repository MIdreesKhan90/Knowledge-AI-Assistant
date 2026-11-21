
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.knowledge_base import KnowledgeBase
from app.models.user import User
from app.routers.documents import get_current_user


router = APIRouter(
    prefix="/knowledge-bases",
    tags=["Knowledge Bases"]
)


class KnowledgeBaseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str | None = None


class KnowledgeBaseUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=150)


def get_user_knowledge_base(
    knowledge_base_id: int,
    user: User,
    db: Session
):
    knowledge_base = db.query(KnowledgeBase).filter(
        KnowledgeBase.id == knowledge_base_id,
        KnowledgeBase.user_id == user.id
    ).first()

    if not knowledge_base:
        raise HTTPException(
            status_code=404,
            detail="Knowledge Base not found"
        )

    return knowledge_base


@router.post("/")
def create_knowledge_base(
    data: KnowledgeBaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    knowledge_base = KnowledgeBase(
        user_id=current_user.id,
        name=data.name.strip(),
        description=data.description
    )

    db.add(knowledge_base)
    db.commit()
    db.refresh(knowledge_base)

    return knowledge_base


@router.get("/")
def get_knowledge_bases(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(KnowledgeBase).filter(
        KnowledgeBase.user_id == current_user.id
    ).order_by(KnowledgeBase.created_at.desc()).all()


@router.get("/{knowledge_base_id}")
def get_knowledge_base(
    knowledge_base_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_user_knowledge_base(
        knowledge_base_id,
        current_user,
        db
    )


@router.patch("/{knowledge_base_id}")
def update_knowledge_base(
    knowledge_base_id: int,
    data: KnowledgeBaseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    knowledge_base = get_user_knowledge_base(
        knowledge_base_id,
        current_user,
        db
    )

    knowledge_base.name = data.name.strip()

    db.commit()
    db.refresh(knowledge_base)

    return knowledge_base


@router.delete("/{knowledge_base_id}")
def delete_knowledge_base(
    knowledge_base_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    knowledge_base = get_user_knowledge_base(
        knowledge_base_id,
        current_user,
        db
    )

    db.delete(knowledge_base)
    db.commit()

    return {
        "message": "Knowledge Base deleted successfully"
    }
