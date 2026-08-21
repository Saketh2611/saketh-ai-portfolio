"""
Embedding service — wraps Cohere's hosted embedding API.

Used identically in every environment: the deployed backend (for live
/chat queries) and any local session (for admin content ingestion).
There is deliberately only one embedding implementation in this app —
never mix this with a locally-loaded model, since two different
embedding models produce vectors in different, non-comparable spaces.
Mixing them silently breaks cosine similarity search system-wide.

Cohere's free trial tier requires no credit card and covers this app's
scale comfortably. embed-multilingual-v3.0 outputs 1024 dimensions.
"""

import logging

import cohere

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

EMBED_MODEL = "embed-multilingual-v3.0"

_client: cohere.AsyncClientV2 | None = None


def get_cohere_client() -> cohere.AsyncClientV2:
    global _client
    if _client is None:
        logger.info("Initializing Cohere client")
        _client = cohere.AsyncClientV2(api_key=settings.cohere_api_key)
    return _client


async def embed_text(text: str) -> list[float]:
    client = get_cohere_client()
    response = await client.embed(
        texts=[text],
        model=EMBED_MODEL,
        input_type="search_query",
        embedding_types=["float"],
    )
    return response.embeddings.float[0]


async def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    client = get_cohere_client()
    response = await client.embed(
        texts=texts,
        model=EMBED_MODEL,
        input_type="search_document",
        embedding_types=["float"],
    )
    return response.embeddings.float