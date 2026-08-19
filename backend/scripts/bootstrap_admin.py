"""
Standalone CLI for admin password bootstrap/reset.

Usage:
    python -m scripts.bootstrap_admin              # create only if missing
    python -m scripts.bootstrap_admin --reset       # force-overwrite with
                                                       current ADMIN_PASSWORD
                                                       from .env — use this
                                                       if you're locked out.

Run from the backend/ directory with your virtualenv active and .env loaded.
"""

import argparse
import asyncio

from app.core.bootstrap import ensure_admin_credentials
from app.core.config import get_settings
from app.db.session import AsyncSessionLocal


async def main(force: bool) -> None:
    settings = get_settings()
    async with AsyncSessionLocal() as db:
        await ensure_admin_credentials(db, settings.admin_password, force=force)
    print("Admin credentials reset." if force else "Admin credentials ensured (created if missing).")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true", help="Force-overwrite existing admin password")
    args = parser.parse_args()

    asyncio.run(main(force=args.reset))
