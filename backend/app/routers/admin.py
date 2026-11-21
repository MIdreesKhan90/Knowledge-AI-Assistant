from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from pydantic import BaseModel
from typing import Literal

from app.database import get_db
from app.models.user import User
from app.core.permissions import get_current_admin

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


# Admin Profile
@router.get("/me")
def get_admin_profile(
    current_admin: User = Depends(get_current_admin)
):
    return {
        "message": "Admin access granted",
        "id": current_admin.id,
        "name": current_admin.name,
        "email": current_admin.email,
        "role": current_admin.role
    }


# Get All Users
@router.get("/users")
def get_all_users(
    search: str = Query(default="", max_length=255),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    query = db.query(User)

    # Search by name or email
    if search.strip():
        search_term = f"%{search.strip()}%"

        query = query.filter(
            (User.name.ilike(search_term)) |
            (User.email.ilike(search_term))
        )

    users = query.order_by(User.created_at.desc()).all()

    return {
        "total_users": len(users),
        "users": [
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "is_active": user.is_active,
                "created_at": user.created_at
            }
            for user in users
        ]
    }


class UserStatusUpdate(BaseModel):
    is_active: bool


# Activate / Deactivate User
@router.patch("/users/{user_id}/status")
def update_user_status(
    user_id: int,
    status_data: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    target_user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Prevent admin from deactivating their own account
    if target_user.id == current_admin.id and not status_data.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account"
        )

    target_user.is_active = status_data.is_active

    db.commit()
    db.refresh(target_user)

    return {
        "message": "User status updated successfully",
        "user": {
            "id": target_user.id,
            "name": target_user.name,
            "email": target_user.email,
            "is_active": target_user.is_active
        }
    }


class UserRoleUpdate(BaseModel):
    role: Literal["admin", "user"]


# Change User Role
@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    role_data: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    target_user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Prevent changing your own role
    if target_user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role"
        )

    # Prevent removing the last administrator
    if target_user.role == "admin" and role_data.role == "user":
        total_admins = (
            db.query(User)
            .filter(User.role == "admin")
            .count()
        )

        if total_admins <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove the last administrator"
            )

    target_user.role = role_data.role

    db.commit()
    db.refresh(target_user)

    return {
        "message": "User role updated successfully",
        "user": {
            "id": target_user.id,
            "name": target_user.name,
            "email": target_user.email,
            "role": target_user.role
        }
    }
