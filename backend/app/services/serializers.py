"""Helpers to convert SQLAlchemy models (with JSON text columns) into Pydantic read schemas."""
import json

from app.models.category import Category
from app.models.scene import Scene
from app.models.seo_package import SEOPackage
from app.models.story import Story
from app.schemas.category import CategorySummary
from app.schemas.scene import SceneRead
from app.schemas.seo_package import SEOPackageRead
from app.schemas.story import StoryListItem, StoryRead, StorySignature


def scene_to_read(scene: Scene) -> SceneRead:
    dialogue = json.loads(scene.dialogue_json) if scene.dialogue_json else []
    return SceneRead(
        id=scene.id,
        story_id=scene.story_id,
        scene_number=scene.scene_number,
        duration_seconds=scene.duration_seconds,
        location=scene.location,
        visual_description=scene.visual_description,
        dialogue=dialogue,
        camera=scene.camera,
        music_sfx=scene.music_sfx,
        created_at=scene.created_at,
        updated_at=scene.updated_at,
    )


def seo_to_read(seo: SEOPackage | None) -> SEOPackageRead | None:
    if seo is None:
        return None
    tags = json.loads(seo.tags_json) if seo.tags_json else []
    return SEOPackageRead(
        id=seo.id,
        story_id=seo.story_id,
        youtube_title=seo.youtube_title,
        description=seo.description,
        tags=tags,
        thumbnail_text=seo.thumbnail_text,
        flow_prompt=seo.flow_prompt,
    )


def story_to_read(story: Story) -> StoryRead:
    signature = StorySignature.model_validate_json(story.signature_json) if story.signature_json else None
    characters = json.loads(story.characters_json) if story.characters_json else []
    return StoryRead(
        id=story.id,
        category_id=story.category_id,
        episode_number=story.episode_number,
        title=story.title,
        hook=story.hook,
        summary=story.summary,
        story_text=story.story_text,
        ending=story.ending,
        location=story.location,
        mood=story.mood,
        status=story.status,
        similarity_score=story.similarity_score,
        signature=signature,
        characters=characters,
        ai_provider=story.ai_provider,
        ai_model=story.ai_model,
        created_at=story.created_at,
        updated_at=story.updated_at,
        scenes=[scene_to_read(s) for s in sorted(story.scenes, key=lambda x: x.scene_number)],
        seo_package=seo_to_read(story.seo_package),
    )


def story_to_list_item(story: Story) -> StoryListItem:
    return StoryListItem(
        id=story.id,
        category_id=story.category_id,
        episode_number=story.episode_number,
        title=story.title,
        summary=story.summary,
        status=story.status,
        similarity_score=story.similarity_score,
        created_at=story.created_at,
    )


def category_to_summary(category: Category, story_count: int, last_generated_at) -> CategorySummary:
    return CategorySummary(
        id=category.id,
        name=category.name,
        description=category.description,
        default_language=category.default_language,
        default_duration=category.default_duration,
        visual_style=category.visual_style,
        custom_instructions=category.custom_instructions,
        created_at=category.created_at,
        updated_at=category.updated_at,
        story_count=story_count,
        last_generated_at=last_generated_at,
    )
