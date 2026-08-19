"""
LLM service — wraps Groq chat completion, constrained to answer only
from retrieved context.

The system prompt is the single most important piece of text in this
whole app: without a hard constraint against outside knowledge, the LLM
will happily fabricate a plausible-sounding answer about a project that
doesn't exist, which is the exact failure mode that makes an "AI
portfolio" look worse than a static one.
"""

import logging

from groq import AsyncGroq

from app.core.config import get_settings
from app.services.retrieval_service import RetrievedChunk

logger = logging.getLogger(__name__)
settings = get_settings()

_client: AsyncGroq | None = None


def get_groq_client() -> AsyncGroq:
    global _client
    if _client is None:
        _client = AsyncGroq(api_key=settings.groq_api_key)
    return _client


SYSTEM_PROMPT = """You are "Saketh AI" — a chatbot embedded in Vaddiparthi Saketh's \
portfolio website, answering recruiter and hiring-manager questions about his \
background, projects, and skills.

Rules you must follow:
1. Answer ONLY using the context provided below. Do not use outside knowledge \
about AI, software engineering, or anything else beyond what's in the context.
2. If the context does not contain enough information to answer the question, \
say so plainly — e.g. "I don't have that specific detail in my knowledge base, \
but you can check his resume or ask him directly." Never guess or fabricate \
details, dates, or numbers.
3. Speak about Saketh in the third person ("He has worked with...", "His \
PacketIQ project..."), like a knowledgeable assistant describing him — not as \
Saketh himself in the first person.
4. Keep answers concise and concrete: 2-4 sentences for most questions. \
Recruiters are skimming, not reading essays.
5. When the context includes specific technologies, metrics, or project names, \
use them precisely — don't round "F1 0.784" down to "great performance," state \
the actual number.
6. Never invent a GitHub link, company name, or metric that isn't in the context."""


def _format_context(chunks: list[RetrievedChunk]) -> str:
    if not chunks:
        return "(no relevant context found)"

    blocks = []
    for i, chunk in enumerate(chunks, start=1):
        blocks.append(f"[Context {i} — source: {chunk.source_type}]\n{chunk.content}")
    return "\n\n".join(blocks)


async def generate_answer(query: str, chunks: list[RetrievedChunk]) -> str:
    """
    Calls Groq with the system prompt + formatted context + user query.
    Returns plain text — the caller (chat endpoint) is responsible for
    attaching structured source citations from the chunk metadata.
    """
    context_block = _format_context(chunks)

    user_message = f"""Context:
{context_block}

Recruiter question: {query}"""

    client = get_groq_client()

    try:
        response = await client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.3,  # low temperature: this is a factual-grounding task, not creative writing
            max_tokens=400,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        logger.exception("Groq completion failed for query: %s", query)
        return (
            "Sorry, I'm having trouble generating an answer right now. "
            "Please try again in a moment, or reach out to Saketh directly."
        )
