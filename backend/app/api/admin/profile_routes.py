"""
Admin profile routes: edit name/headline/summary, upload photo, upload
resume PDF, paste supplementary resume sections.

Every route here requires require_admin — there is no unauthenticated
write path anywhere in this app.
"""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_admin
from app.db.session import get_db
from app.models.orm import Profile
from app.models.schemas import ProfileOut, ProfileUpdate, ResumeSectionCreate
from app.services.content_service import add_resume_section, get_chunk_count, reembed_profile_summary
from app.services.storage_service import upload_file

router = APIRouter(prefix="/api/admin/profile", tags=["admin-profile"])

MAX_PHOTO_BYTES = 5 * 1024 * 1024  # 5MB
MAX_PDF_BYTES = 10 * 1024 * 1024  # 10MB
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.put("", response_model=ProfileOut)
async def update_profile(
    payload: ProfileUpdate,
    _: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> ProfileOut:
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields provided")

    result = await db.execute(select(Profile).limit(1))
    profile = result.scalar_one_or_none()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile row missing")

    for field, value in updates.items():
        setattr(profile, field, value)
    await db.commit()
    await db.refresh(profile)

    # Summary is the field that feeds the RAG index — re-embed only when
    # it actually changed, not on every profile edit (e.g. just editing
    # phone number shouldn't trigger a model call).
    if "summary" in updates:
        await reembed_profile_summary(db, profile.summary, profile.full_name)

    return ProfileOut.model_validate(profile)


@router.post("/photo")
async def upload_photo(
    file: UploadFile = File(...),
    _: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Photo must be JPEG, PNG, or WebP",
        )

    contents = await file.read()
    if len(contents) > MAX_PHOTO_BYTES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Photo must be under 5MB")

    photo_url = await upload_file(contents, file.content_type, folder="photos")

    await db.execute(update(Profile).values(photo_url=photo_url))
    await db.commit()

    return {"photo_url": photo_url}


@router.post("/resume")
async def upload_resume_pdf(
    file: UploadFile = File(...),
    _: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Resume must be a PDF")

    contents = await file.read()
    if len(contents) > MAX_PDF_BYTES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Resume must be under 10MB")

    resume_url = await upload_file(contents, file.content_type, folder="resume")

    await db.execute(update(Profile).values(resume_pdf_url=resume_url))
    await db.commit()

    return {"resume_pdf_url": resume_url}


@router.post("/resume-section", status_code=status.HTTP_201_CREATED)
async def add_resume_text_section(
    payload: ResumeSectionCreate,
    _: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    For pasting supplementary text the chatbot should know that isn't a
    project — e.g. scholastic achievements, positions of responsibility,
    the professional summary paragraph from your resume PDF. This is
    additive: calling it twice with different section_titles adds more
    knowledge, it doesn't replace anything.
    """
    await add_resume_section(db, payload.section_title, payload.content)
    chunk_count = await get_chunk_count(db)
    return {"status": "indexed", "total_chunks": chunk_count}
