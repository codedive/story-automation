"""SEO package model: YouTube metadata generated alongside a story."""
from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SEOPackage(Base):
    __tablename__ = "seo_packages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    story_id: Mapped[int] = mapped_column(
        ForeignKey("stories.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    youtube_title: Mapped[str | None] = mapped_column(String(300), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    thumbnail_text: Mapped[str | None] = mapped_column(String(200), nullable=True)
    flow_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)

    story: Mapped["Story"] = relationship("Story", back_populates="seo_package")
