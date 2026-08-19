"""
Async database engine + session factory.

Uses asyncpg under SQLAlchemy's async engine. One engine per process,
sessions are short-lived per-request via the get_db dependency.
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    echo=not settings.is_production,  # log SQL in dev, silent in prod
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,  # avoids stale-connection errors after idle periods
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency — yields a session, guarantees close, rolls back
    on unhandled exceptions so a failed request never leaves a dangling
    transaction on the connection.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
