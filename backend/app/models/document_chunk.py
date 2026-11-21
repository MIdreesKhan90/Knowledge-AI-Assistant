from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime, JSON, func
from pgvector.sqlalchemy import Vector

from app.database import Base


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)

    document_id = Column(
        Integer,
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)

    embedding = Column(Vector(768), nullable=True)

    chunk_metadata = Column(JSON, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )