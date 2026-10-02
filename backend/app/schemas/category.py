"""Pydantic schemas for Category CRUD."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    default_language: str = "English"
    default_duration: str = "60 Seconds"
    visual_style: str = "2D Animated"
    custom_instructions: str | None = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    default_language: str | None = None
    default_duration: str | None = None
    visual_style: str | None = None
    custom_instructions: str | None = None


class CategoryRead(CategoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class CategorySummary(CategoryRead):
    """Category with aggregate stats for the dashboard grid."""

    story_count: int = 0
    last_generated_at: datetime | None = None


class CategoryDeleteCheck(BaseModel):
    story_count: int
    message: str
