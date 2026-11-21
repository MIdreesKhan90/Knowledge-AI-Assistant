
from sqlalchemy.orm import Session

from app.models.document_chunk import DocumentChunk
from app.models.document import Document
from app.services.embedding_service import generate_embedding


def search_similar_chunks(
    db: Session,
    query: str,
    user_id: int,
    top_k: int = 5,
    knowledge_base_id: int | None = None
):
    if not query.strip():
        raise ValueError("Search query cannot be empty")

    # Convert user question into an embedding
    query_embedding = generate_embedding(
        query,
        task_type="RETRIEVAL_QUERY"
    )

    # Calculate cosine distance
    distance = DocumentChunk.embedding.cosine_distance(
        query_embedding
    ).label("distance")

    # Base query: only current user's documents
    search_query = (
        db.query(DocumentChunk, distance)
        .join(
            Document,
            DocumentChunk.document_id == Document.id
        )
        .filter(
            Document.user_id == user_id,
            DocumentChunk.embedding.isnot(None)
        )
    )

    # Optional Knowledge Base filtering
    if knowledge_base_id is not None:
        search_query = search_query.filter(
            Document.knowledge_base_id == knowledge_base_id
        )

    results = (
        search_query
        .order_by(distance)
        .limit(top_k)
        .all()
    )

    return [
        {
            "document_id": chunk.document_id,
            "chunk_index": chunk.chunk_index,
            "content": chunk.content,
            "metadata": chunk.chunk_metadata,
            "distance": float(distance_value)
        }
        for chunk, distance_value in results
    ]
