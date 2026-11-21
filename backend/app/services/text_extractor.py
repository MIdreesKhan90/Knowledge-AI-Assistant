import pymupdf
from docx import Document


def extract_pdf_text(file_path: str) -> str:
    text = ""

    with pymupdf.open(file_path) as pdf:
        for page in pdf:
            text += page.get_text() + "\n"

    return text.strip()


def extract_docx_text(file_path: str) -> str:
    document = Document(file_path)

    text = []

    for paragraph in document.paragraphs:
        if paragraph.text.strip():
            text.append(paragraph.text)

    return "\n".join(text)


def extract_txt_text(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8-sig") as file:
        return file.read().strip()