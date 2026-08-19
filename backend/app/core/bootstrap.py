"""
Admin credential bootstrap.

Deliberately conservative: on normal app startup this ONLY creates the
admin_credentials row if none exists yet. It never overwrites an existing
hash just because ADMIN_PASSWORD in .env changed — silently changing your
login on every restart because of a stale env var would be a nasty
surprise. To actually change the password, use change_admin_password()
via the authenticated /api/admin/change-password route, or force=True
via the CLI script (scripts/bootstrap_admin.py --reset) if you're locked out.
"""

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.orm import AdminCredentials

logger = logging.getLogger(__name__)


async def ensure_admin_credentials(db: AsyncSession, plain_password: str, force: bool = False) -> None:
    result = await db.execute(select(AdminCredentials).limit(1))
    existing = result.scalar_one_or_none()

    if existing is not None and not force:
        return

    hashed = hash_password(plain_password)

    if existing is None:
        db.add(AdminCredentials(password_hash=hashed))
        logger.info("Admin credentials created.")
    else:
        existing.password_hash = hashed
        logger.info("Admin credentials reset (force=True).")

    await db.commit()


async def change_admin_password(db: AsyncSession, new_plain_password: str) -> None:
    """Used by the authenticated change-password route."""
    result = await db.execute(select(AdminCredentials).limit(1))
    existing = result.scalar_one_or_none()

    hashed = hash_password(new_plain_password)

    if existing is None:
        db.add(AdminCredentials(password_hash=hashed))
    else:
        existing.password_hash = hashed

    await db.commit()
