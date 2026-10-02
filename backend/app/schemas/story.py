"""Pydantic schemas for stories: AI output contract, persistence read/update, and generation requests."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.story import StoryStatus
from app.schemas.scene import SceneAI, SceneRead
from app.schemas.seo_package import SEOPackageAI, SEOPackageRead


class StorySignature(BaseModel):
    """Compact fingerprint of a story's concept, used for duplicate detection."""

    primary_theme: str = ""
    location: str = ""
    conflict_type: str = ""
    hook_type: str = ""
    ending_type: str = ""
    relationship_dynamic: str = ""


class StoryAI(BaseModel):
    """Expected structured JSON shape returned by the AI provider."""

    title: str
    hook: str = ""
    summary: str = ""
    story: str = ""
    ending: str = ""
    characters: list[str] = Field(default_factory=list)
    location: str = ""
    mood: str = ""
    scenes: list[SceneAI] = Field(default_factory=list)
    seo: SEOPackageAI = Field(default_factory=SEOPackageAI)
    signature: StorySignature = Field(default_factory=StorySignature)


class StoryGenerateRequest(BaseModel):
    """Optional user input for the generation endpoint; falls back to category defaults."""

    story_idea: str | None = None
    duration: str | None = None
    language: str | None = None
    emotion_level: str | None = None
    number_of_scenes: int | None = None
    include_title: bool = True
    include_description: bool = True
    include_tags: bool = True
    include_flow_prompt: bool = False
    ai_provider: Literal["openai", "ollama"] | None = None


class StoryManualCreate(BaseModel):
    """Payload for manually adding a story (no AI call) so it still counts toward that
    category's duplicate-detection history for future generations."""

    title: str = Field(..., min_length=1, max_length=300)
    hook: str | None = None
    summary: str | None = None
    story_text: str | None = None
    ending: str | None = None
    location: str | None = None
    mood: str | None = None
    characters: list[str] = Field(default_factory=list)
    status: StoryStatus = StoryStatus.DRAFT
    signature: StorySignature = Field(default_factory=StorySignature)


class StoryUpdate(BaseModel):
    title: str | None = None
    hook: str | None = None
    summary: str | None = None
    story_text: str | None = None
    ending: str | None = None
    location: str | None = None
    mood: str | None = None
    status: StoryStatus | None = None


class StoryListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category_id: int
    episode_number: int
    title: str
    summary: str | None = None
    status: StoryStatus
    similarity_score: float
    created_at: datetime


class StoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category_id: int
    episode_number: int
    title: str
    hook: str | None = None
    summary: str | None = None
    story_text: str | None = None
    ending: str | None = None
    location: str | None = None
    mood: str | None = None
    status: StoryStatus
    similarity_score: float
    signature: StorySignature | None = None
    characters: list[str] = Field(default_factory=list)
    ai_provider: str | None = None
    ai_model: str | None = None
    created_at: datetime
    updated_at: datetime
    scenes: list[SceneRead] = Field(default_factory=list)
    seo_package: SEOPackageRead | None = None
