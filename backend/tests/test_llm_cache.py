from types import SimpleNamespace

import pytest

from app.services import llm_service


@pytest.mark.asyncio
async def test_generate_answer_returns_exact_query_cache_hit(monkeypatch):
    class FakeRedis:
        async def get(self, key):
            assert key.startswith("llm:answer:v2:")
            return "cached answer"

        async def set(self, *args, **kwargs):
            raise AssertionError("set should not be called when cache already exists")

    monkeypatch.setattr(llm_service, "get_redis_client", lambda: FakeRedis())

    async def raise_if_called(**kwargs):
        raise AssertionError("Groq should not be called for an exact cache hit")

    monkeypatch.setattr(
        llm_service,
        "get_groq_client",
        lambda: SimpleNamespace(
            chat=SimpleNamespace(
                completions=SimpleNamespace(create=raise_if_called)
            )
        ),
    )

    answer = await llm_service.generate_answer("Tell me about his projects", [])

    assert answer == "cached answer"
