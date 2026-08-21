"""
Retrieval service — embeds a query and runs pgvector cosine similarity
search across the chunks table.

This is deliberately a single query across all source_types (profile,
project, resume_section) rather than three separate queries unioned
together — pgvector's ivfflat index handles the ranking, and the app
doesn't need per-source-type result quotas at this scale.
"""

import uuid
from dataclasses import dataclass
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.orm import Chunk
from app.services.embedding_service import embed_text
logger = logging.getLogger(__name__)
DEFAULT_TOP_K = 5


@dataclass
class RetrievedChunk:
    id: uuid.UUID
    content: str
    source_type: str
    metadata: dict


async def retrieve_relevant_chunks(
    db: AsyncSession,
    query: str,
    top_k: int = DEFAULT_TOP_K,
) -> list[RetrievedChunk]:
    """
    Embeds `query`, runs cosine-distance ordering against the chunks
    table, returns the top_k closest chunks.

    pgvector's `<=>` operator is cosine distance (lower = more similar).
    We order ascending and take the first top_k rows — the ORM equivalent
    of `ORDER BY embedding <=> :query_vector LIMIT :top_k`.
    """
    query_embedding = await embed_text(query)

    stmt = (
        select(Chunk)
        .order_by(Chunk.embedding.cosine_distance(query_embedding))
        .limit(top_k)
    )

    result = await db.execute(stmt)
    rows = result.scalars().all()
    
    logger.info(rows)

    return [
        RetrievedChunk(
            id=row.id,
            content=row.content,
            source_type=row.source_type,
            metadata=row.metadata_ or {},
        )
        for row in rows
    ]
