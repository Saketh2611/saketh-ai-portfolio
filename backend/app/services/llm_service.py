"""
LLM service — wraps Groq chat completion, constrained to answer only
from retrieved context.

The system prompt is the single most important piece of text in this
whole app: without a hard constraint against outside knowledge, the LLM
will happily fabricate a plausible-sounding answer about a project that
doesn't exist, which is the exact failure mode that makes an "AI
portfolio" look worse than a static one.
"""

import hashlib
import json
import logging
import time
from urllib.parse import quote

import httpx
from groq import AsyncGroq

from app.core.config import get_settings
from app.services.retrieval_service import RetrievedChunk

logger = logging.getLogger(__name__)
settings = get_settings()

_client: AsyncGroq | None = None
_redis_client: "UpstashRedisClient | None" = None


def _as_cached_answer(value: object) -> str | None:
    if isinstance(value, dict):
        for key in ("answer", "content", "response", "text", "value"):
            answer = _as_cached_answer(value.get(key))
            if answer is not None:
                return answer
        return None

    if not isinstance(value, str):
        return None

    try:
        decoded = json.loads(value)
    except json.JSONDecodeError:
        return value

    if isinstance(decoded, str):
        return decoded
    if isinstance(decoded, dict):
        return _as_cached_answer(decoded)
    return value


class UpstashRedisClient:
    """Small async wrapper around the Upstash Redis REST API."""

    def __init__(self, url: str, token: str) -> None:
        self.url = url.rstrip("/")
        self.token = token

    async def get(self, key: str) -> str | None:
        headers = {"Authorization": f"Bearer {self.token}"}
        started_at = time.perf_counter()
        logger.info("Redis cache GET start", extra={"key": key, "redis_action": "get"})
        try:
            response = await httpx.AsyncClient(timeout=10.0).get(
                f"{self.url}/get/{quote(key, safe='')}",
                headers=headers,
            )
            response.raise_for_status()
            payload = response.json()
        except Exception:
            logger.exception(
                "Redis cache GET failed after %.2f ms",
                (time.perf_counter() - started_at) * 1000,
            )
            raise

        if isinstance(payload, dict):
            result = payload.get("result")
            value = _as_cached_answer(result)
            if value is not None:
                logger.info(
                    "Redis cache HIT in %.2f ms",
                    (time.perf_counter() - started_at) * 1000,
                    extra={"key": key, "redis_action": "get", "value_length": len(value)},
                )
                return value

            value = _as_cached_answer(payload.get("value"))
            if value is not None:
                logger.info(
                    "Redis cache HIT in %.2f ms",
                    (time.perf_counter() - started_at) * 1000,
                    extra={"key": key, "redis_action": "get", "value_length": len(value)},
                )
                return value

        logger.info(
            "Redis cache MISS in %.2f ms",
            (time.perf_counter() - started_at) * 1000,
            extra={"key": key, "redis_action": "get"},
        )
        return None

    async def set(self, key: str, value: str, *, ex: int | None = None) -> None:
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "text/plain",
        }
        started_at = time.perf_counter()
        logger.info(
            "Redis cache SET start",
            extra={"key": key, "redis_action": "set", "ttl_seconds": ex, "value_length": len(value)},
        )
        try:
            response = await httpx.AsyncClient(timeout=10.0).post(
                f"{self.url}/set/{quote(key, safe='')}",
                headers=headers,
                params={"EX": ex} if ex is not None else None,
                content=value,
            )
            response.raise_for_status()
        except Exception:
            logger.exception(
                "Redis cache SET failed after %.2f ms",
                (time.perf_counter() - started_at) * 1000,
            )
            raise
        logger.info(
            "Redis cache SET succeeded in %.2f ms",
            (time.perf_counter() - started_at) * 1000,
            extra={"key": key, "redis_action": "set", "ttl_seconds": ex},
        )


def get_groq_client() -> AsyncGroq:
    global _client
    if _client is None:
        _client = AsyncGroq(api_key=settings.groq_api_key)
    return _client


def get_redis_client() -> UpstashRedisClient | None:
    global _redis_client
    if _redis_client is None:
        if not settings.upstash_redis_rest_url or not settings.upstash_redis_rest_token:
            return None
        _redis_client = UpstashRedisClient(
            settings.upstash_redis_rest_url,
            settings.upstash_redis_rest_token,
        )
    return _redis_client


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
    redis_client = get_redis_client()
    cache_key = None
    if redis_client is not None:
        cache_key = "llm:answer:v2:" + hashlib.sha256(query.strip().lower().encode("utf-8")).hexdigest()
        logger.info(
            "LLM cache lookup",
            extra={"query_preview": query[:200], "cache_key": cache_key, "chunk_count": len(chunks)},
        )
        cached_answer = await redis_client.get(cache_key)
        if cached_answer is not None:
            logger.info(
                "LLM cache hit",
                extra={"query_preview": query[:200], "cache_key": cache_key, "answer_length": len(cached_answer)},
            )
            return cached_answer

        logger.info("LLM cache miss", extra={"query_preview": query[:200], "cache_key": cache_key})

    context_block = _format_context(chunks)

    user_message = f"""Context:
{context_block}

Recruiter question: {query}"""

    client = get_groq_client()
    logger.info(
        "Groq request start",
        extra={
            "model": settings.groq_model,
            "query_preview": query[:200],
            "context_chunk_count": len(chunks),
            "cache_key": cache_key,
        },
    )

    groq_started_at = time.perf_counter()
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
        answer = response.choices[0].message.content.strip()
        logger.info(
            "Groq response received in %.2f ms",
            (time.perf_counter() - groq_started_at) * 1000,
            extra={
                "model": settings.groq_model,
                "query_preview": query[:200],
                "answer_length": len(answer),
                "cache_key": cache_key,
            },
        )
        if redis_client is not None:
            # TODO: replace this exact-match lookup with semantic similarity later.
            await redis_client.set(cache_key, answer, ex=86400)
            logger.info("Groq answer cached", extra={"cache_key": cache_key, "ttl_seconds": 86400})
        return answer
    except Exception:
        logger.exception(
            "Groq completion failed after %.2f ms",
            (time.perf_counter() - groq_started_at) * 1000,
            extra={"query_preview": query[:200], "cache_key": cache_key, "model": settings.groq_model},
        )
        return (
            "Sorry, I'm having trouble generating an answer right now. "
            "Please try again in a moment, or reach out to Saketh directly."
        )
