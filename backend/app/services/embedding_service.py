"""
Embedding service — wraps BGE-M3 (sentence-transformers).

The model is loaded once as a module-level singleton, not per-request.
Loading BGE-M3 takes a few seconds; doing that on every /chat call would
make the endpoint unusably slow. FastAPI's startup event triggers the
first load so the first real request isn't the one paying that cost.
"""

import logging

from sentence_transformers import SentenceTransformer

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_model: SentenceTransformer | None = None


def get_embedding_model() -> SentenceTransformer:
    """Lazy singleton — first call loads the model, every call after reuses it."""
    global _model
    if _model is None:
        logger.info("Loading embedding model: %s", settings.embedding_model)
        _model = SentenceTransformer(settings.embedding_model)
        logger.info("Embedding model loaded.")
    return _model


def embed_text(text: str) -> list[float]:
    """Embed a single string. Returns a plain Python list (not a numpy
    array) so it serializes cleanly into the pgvector column."""
    model = get_embedding_model()
    vector = model.encode(text, normalize_embeddings=True)
    return vector.tolist()


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Batch embed — used when chunking a project description into several
    chunks at once. Batching through the model is meaningfully faster than
    calling embed_text() in a loop."""
    if not texts:
        return []
    model = get_embedding_model()
    vectors = model.encode(texts, normalize_embeddings=True, batch_size=16)
    return [v.tolist() for v in vectors]
