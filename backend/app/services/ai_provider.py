"""AI provider abstraction so the OpenAI SDK is never called directly from routes/services."""
from abc import ABC, abstractmethod
from dataclasses import dataclass

import httpx
from openai import AsyncOpenAI

from app.core.config import settings


@dataclass
class AIGenerationResult:
    content: str
    prompt_tokens: int
    completion_tokens: int
    model: str


class AIProvider(ABC):
    provider_name: str = "unknown"

    @abstractmethod
    async def generate_story(self, system_prompt: str, user_prompt: str) -> AIGenerationResult:
        """Call the AI model and return the raw text content (expected to be JSON)."""


class OpenAIProvider(AIProvider):
    provider_name = "openai"

    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model or settings.OPENAI_MODEL
        self._client: AsyncOpenAI | None = None

    @property
    def client(self) -> AsyncOpenAI:
        if self._client is None:
            if not self.api_key:
                raise RuntimeError(
                    "OPENAI_API_KEY is not configured. Set it in backend/.env before generating stories."
                )
            self._client = AsyncOpenAI(api_key=self.api_key)
        return self._client

    async def generate_story(self, system_prompt: str, user_prompt: str) -> AIGenerationResult:
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
        )
        choice = response.choices[0]
        content = choice.message.content or "{}"
        usage = response.usage
        return AIGenerationResult(
            content=content,
            prompt_tokens=usage.prompt_tokens if usage else 0,
            completion_tokens=usage.completion_tokens if usage else 0,
            model=self.model,
        )


class OllamaProvider(AIProvider):
    """Calls a locally (or self-)hosted Ollama server — no API key required."""

    provider_name = "ollama"

    def __init__(self, base_url: str | None = None, model: str | None = None):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.model = model or settings.OLLAMA_MODEL

    async def generate_story(self, system_prompt: str, user_prompt: str) -> AIGenerationResult:
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "stream": False,
            "format": "json",
        }
        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                response = await client.post(f"{self.base_url}/api/chat", json=payload)
                response.raise_for_status()
        except httpx.ConnectError as exc:
            raise RuntimeError(
                f"Could not connect to Ollama at {self.base_url}. Make sure Ollama is running "
                f"(`ollama serve`) and the model is pulled (`ollama pull {self.model}`)."
            ) from exc
        except httpx.HTTPStatusError as exc:
            raise RuntimeError(f"Ollama returned an error: {exc.response.text}") from exc

        data = response.json()
        content = data.get("message", {}).get("content") or "{}"
        return AIGenerationResult(
            content=content,
            prompt_tokens=data.get("prompt_eval_count") or 0,
            completion_tokens=data.get("eval_count") or 0,
            model=self.model,
        )


def get_ai_provider(provider: str | None = None) -> AIProvider:
    name = (provider or settings.AI_PROVIDER or "openai").lower()
    if name == "ollama":
        return OllamaProvider()
    return OpenAIProvider()

