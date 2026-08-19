"""
Rate limiter for /api/chat — the one public endpoint that costs real
money per call (embedding + Groq tokens).

This is an in-memory sliding window, keyed by client IP. It is NOT
distributed-safe: if you ever run more than one backend instance behind
a load balancer, each instance tracks its own counts, so the effective
limit becomes limit-per-instance, not limit-per-app. That's an explicit,
acceptable trade-off at this app's scale (single instance, portfolio
traffic) — swap for a Redis-backed limiter if this ever needs to scale
horizontally.
"""

import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status

from app.core.config import get_settings

settings = get_settings()

# ip -> deque of request timestamps within the current window
_request_log: dict[str, deque[float]] = defaultdict(deque)

WINDOW_SECONDS = 60


def _client_ip(request: Request) -> str:
    # Respect a reverse proxy's forwarded header if present (Render/Vercel
    # both sit behind one), falling back to the direct client host.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def enforce_chat_rate_limit(request: Request) -> None:
    """
    Raises 429 if this IP has exceeded chat_rate_limit_per_minute
    requests in the trailing 60 seconds. Call as a FastAPI dependency
    on the /chat route.
    """
    ip = _client_ip(request)
    now = time.monotonic()
    log = _request_log[ip]

    # drop timestamps outside the trailing window
    while log and now - log[0] > WINDOW_SECONDS:
        log.popleft()

    if len(log) >= settings.chat_rate_limit_per_minute:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many questions in a short time — please wait a moment before asking again.",
        )

    log.append(now)
