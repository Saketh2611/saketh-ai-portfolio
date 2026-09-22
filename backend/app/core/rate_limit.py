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

import tiktoken
from fastapi import Request

from app.core.config import get_settings

settings = get_settings()
enc = tiktoken.get_encoding("o200k_harmony")

_request_log: dict[str, deque[float]] = defaultdict(deque)
_daily_request_log: dict[str, deque[float]] = defaultdict(deque)
_minute_token_log: dict[str, deque[tuple[float, int]]] = defaultdict(deque)
_daily_token_log: dict[str, deque[tuple[float, int]]] = defaultdict(deque)

WINDOW_SECONDS = 60
DAY_SECONDS = 24 * 60 * 60


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _estimate_tokens(text: str) -> int:
    if not text:
        return 0
    return len(enc.encode(text, allowed_special={"<|endoftext|>"}))


def _trim_old_requests(log: deque[float], now: float, window_seconds: float) -> None:
    while log and now - log[0] > window_seconds:
        log.popleft()


def _trim_old_token_usage(log: deque[tuple[float, int]], now: float, window_seconds: float) -> None:
    while log and now - log[0][0] > window_seconds:
        log.popleft()


def enforce_chat_rate_limit(request: Request, query: str | None = None) -> str | None:
    """
    Returns a human-readable message when the client has hit a request or token
    cap, otherwise returns None and records the usage for the current window.
    """
    ip = _client_ip(request)
    now = time.monotonic()
    request_log = _request_log[ip]
    daily_request_log = _daily_request_log[ip]
    minute_token_log = _minute_token_log[ip]
    daily_token_log = _daily_token_log[ip]

    _trim_old_requests(request_log, now, WINDOW_SECONDS)
    _trim_old_requests(daily_request_log, now, DAY_SECONDS)
    _trim_old_token_usage(minute_token_log, now, WINDOW_SECONDS)
    _trim_old_token_usage(daily_token_log, now, DAY_SECONDS)

    if len(request_log) >= settings.chat_rate_limit_per_minute:
        return (
            f"Rate limit reached: {settings.chat_rate_limit_per_minute} requests per minute "
            "is the app cap. Please wait a moment before asking again."
        )

    if len(daily_request_log) >= settings.chat_rate_limit_per_day:
        return (
            f"Daily limit reached: {settings.chat_rate_limit_per_day} requests per day "
            "is the app cap. Please try again tomorrow."
        )

    tokens_used = _estimate_tokens(query or "")
    minute_token_total = sum(token_count for _, token_count in minute_token_log)
    if minute_token_total + tokens_used > settings.chat_token_limit_per_minute:
        return (
            f"Token limit reached: {settings.chat_token_limit_per_minute} tokens per minute "
            "is the app cap. Please wait a moment before asking again."
        )

    daily_token_total = sum(token_count for _, token_count in daily_token_log)
    if daily_token_total + tokens_used > settings.chat_token_limit_per_day:
        return (
            f"Daily token limit reached: {settings.chat_token_limit_per_day} tokens per day "
            "is the app cap. Please try again tomorrow."
        )

    request_log.append(now)
    daily_request_log.append(now)
    minute_token_log.append((now, tokens_used))
    daily_token_log.append((now, tokens_used))
    return None
