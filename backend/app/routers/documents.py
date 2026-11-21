import os
from pathlib import Path
from uuid import uuid4

import jwt

from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    HTTPException,
    Form,
    status,
)
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.knowledge_base import KnowledgeBase
from app.models.user import User

from app.core.security import SECRET_KEY, ALGORITHM

from app.services.document_processor import process_document
from app.services.embedding_service import generate_embedding
from app.services.vector_search import search_similar_chunks
from app.services.rag_service import (
    retrieve_context,
    generate_rag_answer,
)


router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)

security = HTTPBearer()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}


# =====================================================
# AUTHENTICATION
# =====================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = int(payload.get("sub"))

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    return user


# =====================================================
# DOCUMENT OWNERSHIP
# =====================================================

def get_user_document(
    document_id: int,
    db: Session,
    current_user: User
):
    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.user_id == current_user.id
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    return document


def get_user_knowledge_base(
    knowledge_base_id: int,
    db: Session,
    current_user: User
):
    knowledge_base = (
        db.query(KnowledgeBase)
        .filter(
            KnowledgeBase.id == knowledge_base_id,
            KnowledgeBase.user_id == current_user.id
        )
        .first()
    )

    if not knowledge_base:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge Base not found"
        )

    return knowledge_base


# =====================================================
# UPLOAD DOCUMENT
# =====================================================

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    knowledge_base_id: int | None = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if knowledge_base_id is not None:
        get_user_knowledge_base(
            knowledge_base_id,
            db,
            current_user
        )

    extension = Path(file.filename or "").suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, DOCX and TXT files are allowed"
        )

    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="File is empty"
        )

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Maximum file size is 10 MB"
        )

    safe_filename = f"{current_user.id}_{uuid4().hex}{extension}"
    file_path = UPLOAD_DIR / safe_filename

    try:
        with open(file_path, "wb") as uploaded_file:
            uploaded_file.write(content)

        document = Document(
            user_id=current_user.id,
            knowledge_base_id=knowledge_base_id,
            filename=file.filename,
            file_path=str(file_path),
            file_type=extension.replace(".", ""),
            file_size=len(content),
            status="uploaded"
        )

        db.add(document)
        db.commit()
        db.refresh(document)

    except Exception:
        db.rollback()

        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail="Document upload failed"
        )

    return {
        "message": "Document uploaded successfully",
        "document_id": document.id,
        "filename": document.filename,
        "knowledge_base_id": document.knowledge_base_id,
        "status": document.status
    }


# =====================================================
# GET ALL DOCUMENTS
# =====================================================

@router.get("/")
def get_documents(
    knowledge_base_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Document).filter(
        Document.user_id == current_user.id
    )

    if knowledge_base_id is not None:
        get_user_knowledge_base(
            knowledge_base_id,
            db,
            current_user
        )

        query = query.filter(
            Document.knowledge_base_id == knowledge_base_id
        )

    documents = query.order_by(
        Document.created_at.desc()
    ).all()

    return [
        {
            "id": doc.id,
            "filename": doc.filename,
            "file_type": doc.file_type,
            "file_size": doc.file_size,
            "status": doc.status,
            "knowledge_base_id": doc.knowledge_base_id,
            "knowledge_base_name": (
                doc.knowledge_base.name
                if doc.knowledge_base else None
            ),
            "created_at": doc.created_at
        }
        for doc in documents
    ]


# =====================================================
# GET DOCUMENT DETAILS
# =====================================================

@router.get("/{document_id}")
def get_document_details(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = get_user_document(
        document_id,
        db,
        current_user
    )

    return {
        "id": doc.id,
        "filename": doc.filename,
        "file_type": doc.file_type,
        "file_size": doc.file_size,
        "status": doc.status,
        "knowledge_base_id": doc.knowledge_base_id,
        "created_at": doc.created_at
    }


# =====================================================
# DOWNLOAD DOCUMENT
# =====================================================

@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = get_user_document(
        document_id,
        db,
        current_user
    )

    if not os.path.isfile(doc.file_path):
        raise HTTPException(
            status_code=404,
            detail="File not found on server"
        )

    return FileResponse(
        path=doc.file_path,
        filename=doc.filename
    )


# =====================================================
# DELETE DOCUMENT
# =====================================================

@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = get_user_document(
        document_id,
        db,
        current_user
    )

    file_path = Path(doc.file_path)

    db.delete(doc)
    db.commit()

    if file_path.is_file():
        try:
            file_path.unlink()
        except OSError:
            # Database record is already deleted.
            # Log filesystem cleanup failure in production.
            pass

    return {
        "message": "Document deleted successfully"
    }


# =====================================================
# PROCESS DOCUMENT
# =====================================================

@router.post("/{document_id}/process")
def process_uploaded_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = get_user_document(
        document_id,
        db,
        current_user
    )

    try:
        doc.status = "processing"
        db.commit()

        result = process_document(doc.file_path)

        db.query(DocumentChunk).filter(
            DocumentChunk.document_id == doc.id
        ).delete(synchronize_session=False)

        saved_chunks = []

        for index, chunk_text in enumerate(result["chunks"]):
            embedding = generate_embedding(chunk_text)

            chunk = DocumentChunk(
                document_id=doc.id,
                chunk_index=index,
                content=chunk_text,
                embedding=embedding,
                chunk_metadata={
                    "filename": doc.filename,
                    "chunk_index": index
                }
            )

            db.add(chunk)
            saved_chunks.append(chunk)

        doc.status = "processed"
        db.commit()

        return {
            "message": "Document processed and saved successfully",
            "document_id": doc.id,
            "status": doc.status,
            "total_characters": result["total_characters"],
            "total_chunks": len(saved_chunks),
            "embeddings_saved": len(saved_chunks)
        }

    except Exception:
        db.rollback()

        doc = get_user_document(
            document_id,
            db,
            current_user
        )

        doc.status = "failed"
        db.commit()

        raise HTTPException(
            status_code=500,
            detail="Document processing failed"
        )


# =====================================================
# ASSIGN KNOWLEDGE BASE
# =====================================================

class AssignKnowledgeBaseRequest(BaseModel):
    knowledge_base_id: int | None = None


@router.patch("/{document_id}/knowledge-base")
def assign_document_knowledge_base(
    document_id: int,
    request: AssignKnowledgeBaseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = get_user_document(
        document_id,
        db,
        current_user
    )

    if request.knowledge_base_id is not None:
        get_user_knowledge_base(
            request.knowledge_base_id,
            db,
            current_user
        )

    document.knowledge_base_id = request.knowledge_base_id

    db.commit()
    db.refresh(document)

    return {
        "message": "Document Knowledge Base updated successfully",
        "document_id": document.id,
        "knowledge_base_id": document.knowledge_base_id
    }


# =====================================================
# REQUEST SCHEMAS
# =====================================================

class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=5000)
    top_k: int = Field(default=5, ge=1, le=20)
    knowledge_base_id: int | None = None


class AIAskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=5000)
    top_k: int = Field(default=5, ge=1, le=20)
    knowledge_base_id: int | None = None


# =====================================================
# SEMANTIC DOCUMENT SEARCH
# =====================================================

@router.post("/search")
def search_documents(
    request: SearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        if request.knowledge_base_id is not None:
            get_user_knowledge_base(
                request.knowledge_base_id,
                db,
                current_user
            )

        results = search_similar_chunks(
            db=db,
            query=request.query,
            user_id=current_user.id,
            top_k=request.top_k,
            knowledge_base_id=request.knowledge_base_id
        )

        return {
            "query": request.query,
            "knowledge_base_id": request.knowledge_base_id,
            "total_results": len(results),
            "results": results
        }

    except HTTPException:
        raise

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Search failed"
        )


# =====================================================
# ASK AI FROM DOCUMENTS
# =====================================================

@router.post("/ask")
def ask_documents(
    request: AIAskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        question = request.question.strip()

        if not question:
            raise HTTPException(
                status_code=400,
                detail="Question cannot be empty"
            )

        if request.knowledge_base_id is not None:
            get_user_knowledge_base(
                request.knowledge_base_id,
                db,
                current_user
            )

        retrieved = retrieve_context(
            db=db,
            query=question,
            user_id=current_user.id,
            top_k=request.top_k,
            knowledge_base_id=request.knowledge_base_id
        )

        if not retrieved["context"]:
            return {
                "question": question,
                "answer": "I couldn't find relevant information in your documents.",
                "total_sources": 0,
                "sources": []
            }

        answer = generate_rag_answer(
            question=question,
            context=retrieved["context"]
        )

        sources = [
            {
                "document_id": source["document_id"],
                "filename": source["metadata"].get(
                    "filename",
                    "Unknown document"
                ),
                "chunk_index": source["chunk_index"],
                "distance": source["distance"]
            }
            for source in retrieved["sources"]
        ]

        return {
            "question": question,
            "answer": answer,
            "total_sources": len(sources),
            "sources": sources
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="AI Search failed"
        )