"""
Public-facing routes — no auth required. These power the recruiter-facing
site: profile info, project cards, resume link, and the chat endpoint.
"""

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rate_limit import enforce_chat_rate_limit
from app.db.session import get_db
from app.models.orm import ChatLog, Profile, Project
from app.models.schemas import (
    ChatRequest,
    ChatResponse,
    ChatSource,
    ProfileOut,
    ProjectDetailOut,
    ProjectOut,
)
from app.services.llm_service import generate_answer
from app.services.retrieval_service import retrieve_relevant_chunks

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["public"])


@router.get("/profile", response_model=ProfileOut)
async def get_profile(db: AsyncSession = Depends(get_db)) -> ProfileOut:
    result = await db.execute(select(Profile).limit(1))
    profile = result.scalar_one_or_none()

    if profile is None:
        # Should be unreachable — the migration seeds one row — but fail
        # clearly rather than returning a null-shaped 200 if it happens.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not configured yet")

    return ProfileOut.model_validate(profile)


@router.get("/projects", response_model=list[ProjectOut])
async def list_projects(db: AsyncSession = Depends(get_db)) -> list[ProjectOut]:
    result = await db.execute(select(Project).order_by(Project.display_order, Project.created_at.desc()))
    projects = result.scalars().all()
    return [ProjectOut.model_validate(p) for p in projects]


@router.get("/projects/{project_id}", response_model=ProjectDetailOut)
async def get_project(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> ProjectDetailOut:
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()

    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    return ProjectDetailOut.model_validate(project)


@router.get("/resume")
async def get_resume_url(db: AsyncSession = Depends(get_db)) -> dict:
    result = await db.execute(select(Profile.resume_pdf_url).limit(1))
    url = result.scalar_one_or_none()

    if not url:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not uploaded yet")

    return {"resume_url": url}


@router.post("/chat", response_model=ChatResponse, dependencies=[Depends(enforce_chat_rate_limit)])
async def chat(payload: ChatRequest, request: Request, db: AsyncSession = Depends(get_db)) -> ChatResponse:
    """
    The core RAG endpoint: embed query → retrieve chunks → generate
    grounded answer → return answer with source citations.

    Rate-limited via the dependency above (429 on excess). Logs every
    query to chat_logs — useful signal for which chunks are missing
    content recruiters actually ask about.
    """
    chunks = await retrieve_relevant_chunks(db, payload.query)
    answer = await generate_answer(payload.query, chunks)
    logger.info("Chat query: %s, retrieved %d chunks", payload.query, len(chunks))

    sources: list[ChatSource] = []
    seen_titles: set[str] = set()
    for chunk in chunks:
        title = chunk.metadata.get("title", chunk.source_type.replace("_", " ").title())
        if title in seen_titles:
            continue
        seen_titles.add(title)
        sources.append(
            ChatSource(
                title=title,
                url=chunk.metadata.get("github_url"),
                source_type=chunk.source_type,
            )
        )

    client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else None)
    try:
        db.add(
            ChatLog(
                query=payload.query,
                answer=answer,
                retrieved_chunk_ids=[c.id for c in chunks],
                ip_address=client_ip,
            )
        )
        await db.commit()
    except Exception:
        # Logging is best-effort — never fail the user's answer because
        # the analytics write hiccupped.
        logger.exception("Failed to write chat_log entry")
        await db.rollback()

    logger.info("Chat response: %s", answer)
    return ChatResponse(answer=answer, sources=sources)
