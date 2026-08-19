"""
Storage service — uploads photo/resume files to Supabase Storage and
returns public URLs.

Uses the service-role key (server-side only, never exposed to the
frontend) so uploads bypass Row Level Security — appropriate here since
the only writer is the authenticated admin route, already gated by
require_admin.
"""

import logging
import uuid

from supabase import Client, create_client

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_client: Client | None = None


def get_supabase_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.supabase_url, settings.supabase_service_role_key)
    return _client


def _extension_for(content_type: str) -> str:
    mapping = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "application/pdf": "pdf",
    }
    return mapping.get(content_type, "bin")


async def upload_file(file_bytes: bytes, content_type: str, folder: str) -> str:
    """
    Uploads to `{folder}/{uuid}.{ext}` in the configured bucket, returns
    the public URL. A fresh UUID filename on every upload means a photo
    re-upload doesn't need a delete-then-upload dance and old files
    aren't silently overwritten mid-request by a slow concurrent upload.
    """
    client = get_supabase_client()
    ext = _extension_for(content_type)
    path = f"{folder}/{uuid.uuid4()}.{ext}"

    try:
        client.storage.from_(settings.supabase_storage_bucket).upload(
            path=path,
            file=file_bytes,
            file_options={"content-type": content_type},
        )
    except Exception:
        logger.exception("Supabase storage upload failed for path: %s", path)
        raise

    public_url = client.storage.from_(settings.supabase_storage_bucket).get_public_url(path)
    return public_url
