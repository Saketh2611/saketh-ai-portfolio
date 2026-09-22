from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.core import rate_limit as rl
from app.core.config import get_settings


@pytest.fixture(autouse=True)
def clear_logs():
    rl._request_log.clear()
    rl._daily_request_log.clear()
    rl._minute_token_log.clear()
    rl._daily_token_log.clear()
    rl.settings = get_settings()


def test_app_rate_limits_are_half_of_model_caps():
    settings = get_settings()

    assert settings.chat_rate_limit_per_minute == 10
    assert settings.chat_rate_limit_per_day == 500
    assert settings.chat_token_limit_per_minute == 4000
    assert settings.chat_token_limit_per_day == 100000


def test_daily_limit_uses_half_of_model_cap():
    request = SimpleNamespace(
        headers={},
        client=SimpleNamespace(host="203.0.113.10"),
    )
    rl.settings.chat_rate_limit_per_minute = 1000
    rl.settings.chat_token_limit_per_minute = 1000000

    for _ in range(500):
        assert rl.enforce_chat_rate_limit(request, "hello there") is None

    message = rl.enforce_chat_rate_limit(request, "hello there")
    assert message is not None
    assert "500 requests per day" in message
