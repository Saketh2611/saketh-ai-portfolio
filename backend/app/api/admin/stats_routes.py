"""
Dashboard stats — surfaces "how much is actually indexed" so the admin
UI can show a concrete number instead of trusting that saving a project
silently worked.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_admin
from app.db.session import get_db
from app.models.orm import ChatLog, Chunk, Project

router = APIRouter(prefix="/api/admin/stats", tags=["admin-stats"])


@router.get("")
async def get_stats(
    _: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    project_count = (await db.execute(select(func.count(Project.id)))).scalar_one()
    chunk_count = (await db.execute(select(func.count(Chunk.id)))).scalar_one()
    chat_count = (await db.execute(select(func.count(ChatLog.id)))).scalar_one()

    chunks_by_type_result = await db.execute(
        select(Chunk.source_type, func.count(Chunk.id)).group_by(Chunk.source_type)
    )
    chunks_by_type = {row[0]: row[1] for row in chunks_by_type_result.all()}

    return {
        "project_count": project_count,
        "chunk_count": chunk_count,
        "chunks_by_type": chunks_by_type,
        "total_chat_queries": chat_count,
    }


@router.get("/recent-chats")
async def get_recent_chats(
    limit: int = 20,
    _: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    """Lets you see what recruiters are actually asking — useful signal
    for spotting gaps in your indexed content."""
    result = await db.execute(
        select(ChatLog.query, ChatLog.answer, ChatLog.created_at)
        .order_by(ChatLog.created_at.desc())
        .limit(limit)
    )
    return [
        {"query": row.query, "answer": row.answer, "created_at": row.created_at.isoformat()}
        for row in result.all()
    ]
