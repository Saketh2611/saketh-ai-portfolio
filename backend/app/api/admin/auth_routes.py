"""
Admin auth: login issues a JWT, change-password lets you rotate it
without shell access to the DB.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.bootstrap import change_admin_password
from app.core.deps import require_admin
from app.core.security import create_access_token, verify_password
from app.db.session import get_db
from app.models.orm import AdminCredentials
from app.models.schemas import AdminLoginRequest, AdminLoginResponse

router = APIRouter(prefix="/api/admin", tags=["admin-auth"])


@router.post("/login", response_model=AdminLoginResponse)
async def login(payload: AdminLoginRequest, db: AsyncSession = Depends(get_db)) -> AdminLoginResponse:
    result = await db.execute(select(AdminCredentials).limit(1))
    creds = result.scalar_one_or_none()

    if creds is None or not verify_password(payload.password, creds.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password")

    token = create_access_token()
    return AdminLoginResponse(access_token=token)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    new_password: str,
    _: str = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    if len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters"
        )
    await change_admin_password(db, new_password)


@router.get("/verify")
async def verify_token(_: str = Depends(require_admin)) -> dict:
    """Frontend calls this on admin dashboard load to check the stored
    token is still valid before rendering — avoids a flash of the admin
    UI followed by a bounce back to login on an expired token."""
    return {"valid": True}
