from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    BigInteger,
    func
)
from sqlalchemy.orm import relationship

from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    knowledge_base_id = Column(
        Integer,
        ForeignKey("knowledge_bases.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(BigInteger, nullable=False)

    status = Column(String(30), default="uploaded", nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    knowledge_base = relationship(
        "KnowledgeBase",
        back_populates="documents"
    )