"""
Content service — the glue between "admin pastes text" and "text is
retrievable by the chatbot."

Every admin write that touches RAG-relevant content (project descriptions,
profile summary, resume sections) goes through this service so chunk+embed
never gets skipped or done inconsistently across routes.
"""

import uuid

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.orm import Chunk
from app.services.chunking_service import build_project_chunks, split_into_chunks
from app.services.embedding_service import embed_texts


async def reembed_project(db: AsyncSession, project_id: uuid.UUID, title: str, github_url: str | None, full_description: str) -> None:
    """
    Deletes existing chunks for this project and re-creates them from
    the current description. Called on both project create and update —
    an update with no chunk delete step would leave stale chunks pointing
    at old content, which is a much worse failure mode than a slightly
    slower update.
    """
    await db.execute(delete(Chunk).where(Chunk.source_id == project_id, Chunk.source_type == "project"))

    chunk_texts = build_project_chunks(title, full_description)
    if not chunk_texts:
        await db.commit()
        return

    embeddings = embed_texts(chunk_texts)

    for text, embedding in zip(chunk_texts, embeddings):
        db.add(
            Chunk(
                source_type="project",
                source_id=project_id,
                content=text,
                embedding=embedding,
                metadata_={"title": title, "github_url": github_url},
            )
        )

    await db.commit()


async def delete_project_chunks(db: AsyncSession, project_id: uuid.UUID) -> None:
    """Explicit delete for the project-delete route. Note: the DB-level
    ON DELETE CASCADE on chunks.source_id would handle this automatically
    too — this explicit call exists for clarity and for the case where a
    caller wants to clear chunks without deleting the project row itself."""
    await db.execute(delete(Chunk).where(Chunk.source_id == project_id, Chunk.source_type == "project"))
    await db.commit()


async def reembed_profile_summary(db: AsyncSession, summary: str, full_name: str) -> None:
    """
    Re-chunks and re-embeds the profile summary. There's no source_id
    here (profile is a single row, not a foreign-keyed table), so we
    identify "the profile chunks" purely by source_type = 'profile'.
    """
    await db.execute(delete(Chunk).where(Chunk.source_type == "profile"))

    chunk_texts = split_into_chunks(summary)
    if not chunk_texts:
        await db.commit()
        return

    prefixed = [f"About {full_name}:\n\n{chunk}" for chunk in chunk_texts]
    embeddings = embed_texts(prefixed)

    for text, embedding in zip(prefixed, embeddings):
        db.add(
            Chunk(
                source_type="profile",
                source_id=None,
                content=text,
                embedding=embedding,
                metadata_={"title": "Profile Summary"},
            )
        )

    await db.commit()


async def add_resume_section(db: AsyncSession, section_title: str, content: str) -> None:
    """
    Adds a resume section as new chunks WITHOUT deleting existing resume
    sections — unlike projects and profile summary, resume sections are
    additive (you might paste "Education", then "Experience", then
    "Skills" as separate calls, not replace one blob each time).

    To edit/remove a specific section, an admin would need a delete-by-
    section-title route — not built here since the resume PDF upload
    covers the primary "here's my resume" use case; this endpoint is for
    supplementary text you want the bot to know that isn't naturally a
    project (e.g. scholastic achievements, positions of responsibility).
    """
    chunk_texts = split_into_chunks(content)
    if not chunk_texts:
        return

    prefixed = [f"{section_title}:\n\n{chunk}" for chunk in chunk_texts]
    embeddings = embed_texts(prefixed)

    for text, embedding in zip(prefixed, embeddings):
        db.add(
            Chunk(
                source_type="resume_section",
                source_id=None,
                content=text,
                embedding=embedding,
                metadata_={"title": section_title},
            )
        )

    await db.commit()


async def get_chunk_count(db: AsyncSession) -> int:
    """Used by the admin dashboard to show '48 chunks indexed' as a
    sanity signal that content is actually feeding the RAG pipeline."""
    result = await db.execute(select(Chunk.id))
    return len(result.scalars().all())
