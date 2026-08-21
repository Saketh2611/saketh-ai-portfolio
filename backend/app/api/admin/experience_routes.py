"""
Admin experience CRUD — mirrors project_routes.py exactly.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_admin
from app.db.session import get_db
from app.models.orm import Experience
from app.models.schemas import ExperienceCreate, ExperienceDetailOut, ExperienceUpdate
from app.services.content_service import delete_experience_chunks, reembed_experience

router = APIRouter(prefix="/api/admin/experiences", tags=["admin-experiences"])


@router.get("", response_model=list[ExperienceDetailOut])
async def list_experiences_admin(
    _: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> list[ExperienceDetailOut]:
    result = await db.execute(select(Experience).order_by(Experience.display_order, Experience.created_at.desc()))
    return [ExperienceDetailOut.model_validate(e) for e in result.scalars().all()]


@router.post("", response_model=ExperienceDetailOut, status_code=status.HTTP_201_CREATED)
async def create_experience(
    payload: ExperienceCreate,
    _: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> ExperienceDetailOut:
    experience = Experience(**payload.model_dump())
    db.add(experience)
    await db.commit()
    await db.refresh(experience)

    await reembed_experience(db, experience.id, experience.role_title, experience.company, experience.full_description)

    return ExperienceDetailOut.model_validate(experience)


@router.put("/{experience_id}", response_model=ExperienceDetailOut)
async def update_experience(
    experience_id: uuid.UUID,
    payload: ExperienceUpdate,
    _: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> ExperienceDetailOut:
    result = await db.execute(select(Experience).where(Experience.id == experience_id))
    experience = result.scalar_one_or_none()
    if experience is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience not found")

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields provided")

    for field, value in updates.items():
        setattr(experience, field, value)
    await db.commit()
    await db.refresh(experience)

    if "full_description" in updates or "role_title" in updates or "company" in updates:
        await reembed_experience(db, experience.id, experience.role_title, experience.company, experience.full_description)

    return ExperienceDetailOut.model_validate(experience)


@router.delete("/{experience_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_experience(
    experience_id: uuid.UUID,
    _: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(select(Experience).where(Experience.id == experience_id))
    experience = result.scalar_one_or_none()
    if experience is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience not found")

    await delete_experience_chunks(db, experience_id)
    await db.delete(experience)
    await db.commit()