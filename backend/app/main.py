"""
App entrypoint. Run with: uvicorn app.main:app --reload

Startup does two things eagerly rather than lazily on first request:
1. Ensures admin credentials exist (idempotent — see core/bootstrap.py)
2. Preloads the embedding model (BGE-M3 takes a few seconds to load;
   better to pay that cost once at boot than on whoever's /chat request
   happens to be first)
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.admin.auth_routes import router as admin_auth_router
from app.api.admin.profile_routes import router as admin_profile_router
from app.api.admin.project_routes import router as admin_project_router
from app.api.admin.stats_routes import router as admin_stats_router
from app.api.public.routes import router as public_router
from app.core.bootstrap import ensure_admin_credentials
from app.core.config import get_settings
from app.db.session import AsyncSessionLocal
from app.services.embedding_service import get_embedding_model

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up: environment=%s", settings.environment)

    async with AsyncSessionLocal() as db:
        await ensure_admin_credentials(db, settings.admin_password, force=False)

    # Preload synchronously at startup — a few seconds of slower boot
    # beats a few seconds of slower first chat response.
    get_embedding_model()

    logger.info("Startup complete.")
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title="Saketh AI — Portfolio Backend",
    description="RAG-powered portfolio API: profile, projects, and a chatbot grounded in real content.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(public_router)
app.include_router(admin_auth_router)
app.include_router(admin_profile_router)
app.include_router(admin_project_router)
app.include_router(admin_stats_router)


@app.get("/health")
async def health() -> dict:
    """Deploy platforms (Render, Railway, etc.) poll this to confirm the
    service is alive — kept dependency-free so it doesn't fail just
    because the DB is briefly unreachable."""
    return {"status": "ok", "environment": settings.environment}
