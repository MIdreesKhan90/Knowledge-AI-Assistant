import os

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
MODEL = os.getenv("EMBEDDING_MODEL", "gemini-embedding-001")
DIMENSIONS = int(os.getenv("EMBEDDING_DIMENSIONS", "768"))

if not API_KEY:
    raise ValueError("GEMINI_API_KEY is missing from .env")

client = genai.Client(api_key=API_KEY)


def generate_embedding(
    text: str,
    task_type: str = "RETRIEVAL_DOCUMENT"
) -> list[float]:

    if not text.strip():
        raise ValueError("Text cannot be empty")

    response = client.models.embed_content(
        model=MODEL,
        contents=text,
        config=types.EmbedContentConfig(
            task_type=task_type,
            output_dimensionality=DIMENSIONS,
        ),
    )

    return response.embeddings[0].values