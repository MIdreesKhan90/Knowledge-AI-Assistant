from pathlib import Path

from app.services.text_extractor import (
    extract_pdf_text,
    extract_docx_text,
    extract_txt_text
)
from app.services.text_cleaner import clean_text
from app.services.text_chunker import chunk_text


def process_document(file_path: str) -> dict:
    extension = Path(file_path).suffix.lower()

    if extension == ".pdf":
        text = extract_pdf_text(file_path)

    elif extension == ".docx":
        text = extract_docx_text(file_path)

    elif extension == ".txt":
        text = extract_txt_text(file_path)

    else:
        raise ValueError("Unsupported document format")

    cleaned_text = clean_text(text)

    if not cleaned_text:
        raise ValueError("Document contains no extractable text")

    chunks = chunk_text(cleaned_text)

    return {
        "filename": Path(file_path).name,
        "total_characters": len(cleaned_text),
        "total_chunks": len(chunks),
        "chunks": chunks
    }
