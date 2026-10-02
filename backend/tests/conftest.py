"""Shared pytest fixtures: isolated temp-file SQLite DB per test, FastAPI TestClient, and a fake AI provider
so tests never call the real OpenAI API."""
import json
import os
import tempfile
from dataclasses import dataclass

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ.setdefault("OPENAI_API_KEY", "test-key")

from app.core.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.services.ai_provider import AIGenerationResult  # noqa: E402


@pytest.fixture()
def db_engine():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    engine = create_engine(f"sqlite:///{path}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()
    os.remove(path)


@pytest.fixture()
def client(db_engine):
    testing_session_local = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)

    def override_get_db():
        db = testing_session_local()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@dataclass
class FakeAIProvider:
    responses: list[str]
    call_count: int = 0

    async def generate_story(self, system_prompt: str, user_prompt: str) -> AIGenerationResult:
        idx = min(self.call_count, len(self.responses) - 1)
        content = self.responses[idx]
        self.call_count += 1
        return AIGenerationResult(content=content, prompt_tokens=10, completion_tokens=20, model="fake-model")


@pytest.fixture()
def mock_ai_provider(monkeypatch):
    def _set(provider: FakeAIProvider):
        monkeypatch.setattr("app.services.story_generator.get_ai_provider", lambda *_, **__: provider)

    return _set


def make_story_json(
    title="Sample Story",
    location="Cafe",
    summary="A short summary.",
    hook="A gripping hook.",
    ending="A happy ending.",
    signature: dict | None = None,
    flow_prompt: str = "",
):
    sig = signature or {
        "primary_theme": "slice of life",
        "location": location,
        "conflict_type": "misunderstanding",
        "hook_type": "curiosity",
        "ending_type": "resolution",
        "relationship_dynamic": "friends",
    }
    return json.dumps(
        {
            "title": title,
            "hook": hook,
            "summary": summary,
            "story": "Full story text goes here.",
            "ending": ending,
            "characters": ["Raj", "Simran"],
            "location": location,
            "mood": "warm",
            "scenes": [
                {
                    "scene_number": 1,
                    "duration_seconds": 8,
                    "location": location,
                    "visual_description": "Opening shot.",
                    "dialogue": ["Hello!"],
                    "camera": "close-up",
                    "music_sfx": "soft piano",
                },
                {
                    "scene_number": 2,
                    "duration_seconds": 8,
                    "location": location,
                    "visual_description": "Closing shot.",
                    "dialogue": ["Goodbye!"],
                    "camera": "wide",
                    "music_sfx": "soft piano",
                },
            ],
            "seo": {
                "youtube_title": title,
                "description": summary,
                "tags": ["story", "shorts"],
                "thumbnail_text": title,
                "flow_prompt": flow_prompt,
            },
            "signature": sig,
        }
    )
