"""
Admin project CRUD. This is the primary content-entry flow: paste a
title, GitHub link, and description → the project appears on the site
AND becomes retrievable by the chatbot in the same request.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_admin
from app.db.session import get_db
from app.models.orm import Project
from app.models.schemas import ProjectCreate, ProjectDetailOut, ProjectUpdate
from app.services.content_service import delete_project_chunks, reembed_project

router = APIRouter(prefix="/api/admin/projects", tags=["admin-projects"])


@router.get("", response_model=list[ProjectDetailOut])
async def list_projects_admin(
    _: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> list[ProjectDetailOut]:
    """Admin list view includes full_description (unlike the public list,
    which only sends short_description to keep the card payload small)."""
    result = await db.execute(select(Project).order_by(Project.display_order, Project.created_at.desc()))
    return [ProjectDetailOut.model_validate(p) for p in result.scalars().all()]


@router.post("", response_model=ProjectDetailOut, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate,
    _: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> ProjectDetailOut:
    project = Project(**payload.model_dump())
    db.add(project)
    await db.commit()
    await db.refresh(project)

    # Chunk + embed immediately so the project is retrievable by the
    # chatbot the moment it's saved — no separate "publish" step to forget.
    await reembed_project(db, project.id, project.title, project.github_url, project.full_description)

    return ProjectDetailOut.model_validate(project)


@router.put("/{project_id}", response_model=ProjectDetailOut)
async def update_project(
    project_id: uuid.UUID,
    payload: ProjectUpdate,
    _: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> ProjectDetailOut:
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields provided")

    for field, value in updates.items():
        setattr(project, field, value)
    await db.commit()
    await db.refresh(project)

    # Only re-embed if content that actually feeds retrieval changed.
    # Reordering display_order or fixing a typo in live_url shouldn't
    # trigger a model call.
    if "full_description" in updates or "title" in updates:
        await reembed_project(db, project.id, project.title, project.github_url, project.full_description)

    return ProjectDetailOut.model_validate(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: uuid.UUID,
    _: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    # Explicit chunk cleanup before the row delete. The FK's ON DELETE
    # CASCADE would also catch this, but being explicit here means the
    # behavior doesn't silently depend on a migration detail someone
    # might change later.
    await delete_project_chunks(db, project_id)

    await db.delete(project)
    await db.commit()
