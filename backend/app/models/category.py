"""Category model: a content niche (e.g. Romantic Love Stories) with its own story history and defaults."""
from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    default_language: Mapped[str] = mapped_column(String(50), default="English", nullable=False)
    default_duration: Mapped[str] = mapped_column(String(50), default="60 Seconds", nullable=False)
    visual_style: Mapped[str] = mapped_column(String(100), default="2D Animated", nullable=False)
    custom_instructions: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    stories: Mapped[list["Story"]] = relationship(
        "Story", back_populates="category", cascade="all, delete-orphan", order_by="Story.episode_number"
    )
