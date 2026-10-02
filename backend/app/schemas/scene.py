"""Pydantic schemas for scenes, including the structured AI output shape."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class SceneAI(BaseModel):
    """Shape expected from the AI JSON response for a single scene."""

    scene_number: int
    duration_seconds: int = 8
    location: str = ""
    visual_description: str = ""
    dialogue: list[str] = Field(default_factory=list)
    camera: str = ""
    music_sfx: str = ""


class SceneRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    story_id: int
    scene_number: int
    duration_seconds: int
    location: str | None = None
    visual_description: str | None = None
    dialogue: list[str] = Field(default_factory=list)
    camera: str | None = None
    music_sfx: str | None = None
    created_at: datetime
    updated_at: datetime


class SceneUpdate(BaseModel):
    duration_seconds: int | None = None
    location: str | None = None
    visual_description: str | None = None
    dialogue: list[str] | None = None
    camera: str | None = None
    music_sfx: str | None = None


class SceneRegenerateRequest(BaseModel):
    ai_provider: Literal["openai", "ollama"] | None = None
