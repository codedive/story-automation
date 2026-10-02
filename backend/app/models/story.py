"""Story model: a single generated story belonging to a category, with its own scenes and SEO package."""
import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class StoryStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    APPROVED = "APPROVED"
    PUBLISHED = "PUBLISHED"


class Story(Base):
    __tablename__ = "stories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True)
    episode_number: Mapped[int] = mapped_column(Integer, nullable=False)

    title: Mapped[str] = mapped_column(String(300), nullable=False)
    hook: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    story_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    ending: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    mood: Mapped[str | None] = mapped_column(String(100), nullable=True)

    status: Mapped[StoryStatus] = mapped_column(Enum(StoryStatus), default=StoryStatus.DRAFT, nullable=False)
    similarity_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    signature_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    characters_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_provider: Mapped[str | None] = mapped_column(String(50), nullable=True)
    ai_model: Mapped[str | None] = mapped_column(String(100), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    category: Mapped["Category"] = relationship("Category", back_populates="stories")
    scenes: Mapped[list["Scene"]] = relationship(
        "Scene", back_populates="story", cascade="all, delete-orphan", order_by="Scene.scene_number"
    )
    seo_package: Mapped["SEOPackage"] = relationship(
        "SEOPackage", back_populates="story", cascade="all, delete-orphan", uselist=False
    )
