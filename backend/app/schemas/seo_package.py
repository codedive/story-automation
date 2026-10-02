"""Pydantic schemas for the SEO package AI output / persistence."""
from pydantic import BaseModel, ConfigDict, Field


class SEOPackageAI(BaseModel):
    youtube_title: str = ""
    description: str = ""
    tags: list[str] = Field(default_factory=list)
    thumbnail_text: str = ""
    flow_prompt: str = ""


class SEOPackageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    story_id: int
    youtube_title: str | None = None
    description: str | None = None
    tags: list[str] = Field(default_factory=list)
    thumbnail_text: str | None = None
    flow_prompt: str | None = None
