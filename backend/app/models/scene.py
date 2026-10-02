"""Scene model: an individual beat/shot inside a story."""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Scene(Base):
    __tablename__ = "scenes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    story_id: Mapped[int] = mapped_column(ForeignKey("stories.id", ondelete="CASCADE"), nullable=False, index=True)
    scene_number: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=8, nullable=False)
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    visual_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    dialogue_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    camera: Mapped[str | None] = mapped_column(String(200), nullable=True)
    music_sfx: Mapped[str | None] = mapped_column(String(200), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    story: Mapped["Story"] = relationship("Story", back_populates="scenes")
