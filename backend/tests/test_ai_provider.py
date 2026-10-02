"""Tests for the AI provider factory and OllamaProvider (HTTP calls are mocked)."""
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from app.services.ai_provider import OllamaProvider, OpenAIProvider, get_ai_provider


def test_get_ai_provider_defaults_to_openai():
    assert isinstance(get_ai_provider(), OpenAIProvider)
    assert isinstance(get_ai_provider("openai"), OpenAIProvider)


def test_get_ai_provider_returns_ollama_when_requested():
    assert isinstance(get_ai_provider("ollama"), OllamaProvider)
    assert isinstance(get_ai_provider("OLLAMA"), OllamaProvider)


@pytest.mark.asyncio
async def test_ollama_provider_parses_response():
    fake_response = MagicMock()
    fake_response.raise_for_status = MagicMock()
    fake_response.json.return_value = {
        "message": {"content": '{"title": "Test"}'},
        "prompt_eval_count": 12,
        "eval_count": 34,
    }

    fake_client = AsyncMock()
    fake_client.post = AsyncMock(return_value=fake_response)
    fake_client.__aenter__ = AsyncMock(return_value=fake_client)
    fake_client.__aexit__ = AsyncMock(return_value=False)

    with patch("app.services.ai_provider.httpx.AsyncClient", return_value=fake_client):
        provider = OllamaProvider(base_url="http://localhost:11434", model="llama3.1")
        result = await provider.generate_story("system", "user")

    assert result.content == '{"title": "Test"}'
    assert result.prompt_tokens == 12
    assert result.completion_tokens == 34
    assert result.model == "llama3.1"


@pytest.mark.asyncio
async def test_ollama_provider_raises_clear_error_on_connection_failure():
    fake_client = AsyncMock()
    fake_client.post = AsyncMock(side_effect=httpx.ConnectError("refused"))
    fake_client.__aenter__ = AsyncMock(return_value=fake_client)
    fake_client.__aexit__ = AsyncMock(return_value=False)

    with patch("app.services.ai_provider.httpx.AsyncClient", return_value=fake_client):
        provider = OllamaProvider(base_url="http://localhost:11434", model="llama3.1")
        with pytest.raises(RuntimeError, match="Could not connect to Ollama"):
            await provider.generate_story("system", "user")
