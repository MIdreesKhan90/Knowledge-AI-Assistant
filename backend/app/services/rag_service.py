
from sqlalchemy.orm import Session
from google.genai import types

from app.services.vector_search import search_similar_chunks

import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY"),
    http_options=types.HttpOptions(timeout=30000)
)

LLM_MODEL = "gemini-3.5-flash-lite"


def retrieve_context(
    db: Session,
    query: str,
    user_id: int,
    top_k: int = 5,
    knowledge_base_id: int | None = None
):
    results = search_similar_chunks(
        db=db,
        query=query,
        user_id=user_id,
        top_k=top_k,
        knowledge_base_id=knowledge_base_id
    )

    context_parts = []

    for result in results:
        context_parts.append(
            f"Source: {result['metadata']['filename']}\n"
            f"Content: {result['content']}"
        )

    context = "\n\n".join(context_parts)

    return {
        "context": context,
        "sources": results,
        "total_sources": len(results)
    }


def generate_rag_answer(question: str, context: str):

    if not context.strip():
        return "I couldn't find relevant information in your documents."

    prompt = f"""
You are KnowledgeAI, an AI knowledge assistant.

Answer the user's question using ONLY the provided document context.

Rules:
- Do not invent information.
- If the answer is not available in the context, say so.
- Give clear and helpful answers.
- Keep answers relevant to the question.

DOCUMENT CONTEXT:
{context}

USER QUESTION:
{question}

ANSWER:
"""

    response = client.models.generate_content(
        model=LLM_MODEL,
        contents=prompt
    )

    if not response.text:
        raise ValueError("Gemini returned an empty response")

    return response.text
