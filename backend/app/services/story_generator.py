"""Orchestrates story generation: builds prompts, calls the AI provider, runs duplicate checks,
persists accepted stories (with scenes + SEO package), and supports full/scene regeneration."""
import json
import logging

from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.category import Category
from app.models.generation_log import GenerationLog
from app.models.scene import Scene
from app.models.seo_package import SEOPackage
from app.models.story import Story, StoryStatus
from app.schemas.story import StoryAI, StoryGenerateRequest, StorySignature
from app.services.ai_provider import AIProvider, get_ai_provider
from app.services.duplicate_checker import evaluate_duplicate

logger = logging.getLogger(__name__)

RECENT_HISTORY_LIMIT = 20


class StoryGenerationError(Exception):
    """Raised when the AI output cannot be parsed/validated or all regeneration attempts are exhausted."""


def _get_recent_stories(db: Session, category_id: int, exclude_story_id: int | None = None) -> list[Story]:
    query = db.query(Story).filter(Story.category_id == category_id)
    if exclude_story_id is not None:
        query = query.filter(Story.id != exclude_story_id)
    return query.order_by(Story.episode_number.desc()).limit(RECENT_HISTORY_LIMIT).all()


def get_next_episode_number(db: Session, category_id: int) -> int:
    last = (
        db.query(Story)
        .filter(Story.category_id == category_id)
        .order_by(Story.episode_number.desc())
        .first()
    )
    return (last.episode_number + 1) if last else 1


def _build_system_prompt(category: Category) -> str:
    return (
        "You are an expert short-form video story IDEA generator for YouTube Shorts/Reels. "
        "Your ONLY job is to invent ONE concise, unique STORY CONCEPT (not a full script) for the content "
        "niche/category described below, strictly following its custom instructions. The user will take your "
        "idea and develop the full script, dialogue and scenes themselves elsewhere (e.g. in ChatGPT), so do "
        "NOT write the full story text or a scene-by-scene breakdown.\n\n"
        f"Category: {category.name}\n"
        f"Description: {category.description or 'N/A'}\n"
        f"Default language: {category.default_language}\n"
        f"Visual style: {category.visual_style}\n"
        f"Custom instructions:\n{category.custom_instructions or 'None provided.'}\n\n"
        "You MUST respond with ONLY a single valid JSON object (no markdown, no commentary) matching exactly "
        "this schema:\n"
        "{\n"
        '  "title": string,\n'
        '  "hook": string,\n'
        '  "summary": string,\n'
        '  "story": "",\n'
        '  "ending": string,\n'
        '  "characters": [string],\n'
        '  "location": string,\n'
        '  "mood": string,\n'
        '  "scenes": [],\n'
        '  "seo": {"youtube_title": "", "description": "", "tags": [], "thumbnail_text": "", "flow_prompt": ""},\n'
        '  "signature": {\n'
        '    "primary_theme": string,\n'
        '    "location": string,\n'
        '    "conflict_type": string,\n'
        '    "hook_type": string,\n'
        '    "ending_type": string,\n'
        '    "relationship_dynamic": string\n'
        "  }\n"
        "}\n"
        "\n"
        "Field guidance: 'title' is a short catchy title. 'hook' is a 1-2 sentence opening hook. 'summary' is the "
        "core idea/premise in 2-4 sentences — this is the main deliverable the user will paste elsewhere to "
        "develop the full story. 'ending' is one optional line on how it could resolve. Leave 'story', 'scenes' "
        "and all 'seo' fields exactly empty ('' / []) — they are not needed for an idea-only generation. "
        "'signature' is still required in full, since it is used internally to detect duplicate concepts."
    )


def _format_previous_story(index: int, story: Story) -> str:
    return (
        f"{index}.\n"
        f"Title: {story.title}\n"
        f"Location: {story.location or 'N/A'}\n"
        f"Premise: {story.summary or 'N/A'}\n"
        f"Conflict: {(json.loads(story.signature_json).get('conflict_type') if story.signature_json else 'N/A')}\n"
        f"Ending: {story.ending or 'N/A'}\n"
    )


def _build_user_prompt(
    category: Category,
    request: StoryGenerateRequest,
    previous_stories: list[Story],
    regeneration_feedback: str | None = None,
) -> str:
    parts: list[str] = []
    parts.append("Generate ONE new, unique story IDEA/CONCEPT for this category (not a full script).")
    parts.append(f"Story idea / topic from user: {request.story_idea or 'No specific idea given, use your creativity.'}")
    parts.append(f"Language: {request.language or category.default_language}")

    if previous_stories:
        parts.append(
            "\nDO NOT repeat these previous concepts (same category history, most recent first). "
            "Vary location, conflict, hook and ending substantially:\n"
        )
        for i, story in enumerate(previous_stories, start=1):
            parts.append(_format_previous_story(i, story))
        parts.append("\nGenerate a concept substantially different from all of the above.")
    else:
        parts.append("\nThis is the first story in this category, so any fresh concept is acceptable.")

    if regeneration_feedback:
        parts.append(f"\nIMPORTANT: {regeneration_feedback}")

    return "\n".join(parts)


def _parse_ai_response(raw_content: str) -> StoryAI:
    try:
        data = json.loads(raw_content)
    except json.JSONDecodeError as exc:
        raise StoryGenerationError(f"AI returned invalid JSON: {exc}") from exc
    try:
        return StoryAI.model_validate(data)
    except ValidationError as exc:
        raise StoryGenerationError(f"AI JSON did not match expected schema: {exc}") from exc


def _persist_story(
    db: Session,
    category: Category,
    episode_number: int,
    parsed: StoryAI,
    similarity_score: float,
    ai_provider: str,
    ai_model: str,
    existing_story: Story | None = None,
) -> Story:
    """Create (or overwrite the content of) a Story row together with its scenes and SEO package."""
    signature_json = parsed.signature.model_dump_json()
    characters_json = json.dumps(parsed.characters)

    if existing_story is not None:
        story = existing_story
        story.title = parsed.title
        story.hook = parsed.hook
        story.summary = parsed.summary
        story.story_text = parsed.story
        story.ending = parsed.ending
        story.location = parsed.location
        story.mood = parsed.mood
        story.similarity_score = similarity_score
        story.signature_json = signature_json
        story.characters_json = characters_json
        story.ai_provider = ai_provider
        story.ai_model = ai_model
        story.scenes.clear()
        if story.seo_package is not None:
            db.delete(story.seo_package)
            story.seo_package = None
    else:
        story = Story(
            category_id=category.id,
            episode_number=episode_number,
            title=parsed.title,
            hook=parsed.hook,
            summary=parsed.summary,
            story_text=parsed.story,
            ending=parsed.ending,
            location=parsed.location,
            mood=parsed.mood,
            status=StoryStatus.DRAFT,
            similarity_score=similarity_score,
            signature_json=signature_json,
            characters_json=characters_json,
            ai_provider=ai_provider,
            ai_model=ai_model,
        )
        db.add(story)

    db.flush()

    for scene_ai in parsed.scenes:
        db.add(
            Scene(
                story_id=story.id,
                scene_number=scene_ai.scene_number,
                duration_seconds=scene_ai.duration_seconds,
                location=scene_ai.location,
                visual_description=scene_ai.visual_description,
                dialogue_json=json.dumps(scene_ai.dialogue),
                camera=scene_ai.camera,
                music_sfx=scene_ai.music_sfx,
            )
        )

    db.add(
        SEOPackage(
            story_id=story.id,
            youtube_title=parsed.seo.youtube_title,
            description=parsed.seo.description,
            tags_json=json.dumps(parsed.seo.tags),
            thumbnail_text=parsed.seo.thumbnail_text,
            flow_prompt=parsed.seo.flow_prompt,
        )
    )

    return story


async def generate_story(
    db: Session,
    category: Category,
    request: StoryGenerateRequest,
    provider: AIProvider | None = None,
    existing_story: Story | None = None,
) -> Story:
    """Generate (or regenerate) a story, running duplicate detection and up to MAX_REGENERATION_ATTEMPTS retries."""
    provider = provider or get_ai_provider(request.ai_provider)
    exclude_id = existing_story.id if existing_story else None
    previous_stories = _get_recent_stories(db, category.id, exclude_story_id=exclude_id)

    episode_number = existing_story.episode_number if existing_story else get_next_episode_number(db, category.id)

    system_prompt = _build_system_prompt(category)
    regeneration_feedback: str | None = None
    last_error: str | None = None

    max_attempts = settings.MAX_REGENERATION_ATTEMPTS
    for attempt in range(1, max_attempts + 1):
        user_prompt = _build_user_prompt(category, request, previous_stories, regeneration_feedback)
        try:
            result = await provider.generate_story(system_prompt, user_prompt)
        except Exception as exc:  # network/auth/provider errors
            db.add(
                GenerationLog(
                    category_id=category.id,
                    story_id=existing_story.id if existing_story else None,
                    generation_attempt=attempt,
                    model=getattr(provider, "model", None) or settings.OPENAI_MODEL,
                    status="ERROR",
                    error_message=str(exc),
                )
            )
            db.commit()
            raise StoryGenerationError(f"AI provider call failed: {exc}") from exc

        try:
            parsed = _parse_ai_response(result.content)
        except StoryGenerationError as exc:
            last_error = str(exc)
            db.add(
                GenerationLog(
                    category_id=category.id,
                    story_id=existing_story.id if existing_story else None,
                    generation_attempt=attempt,
                    model=result.model,
                    prompt_tokens=result.prompt_tokens,
                    completion_tokens=result.completion_tokens,
                    status="INVALID_JSON",
                    error_message=last_error,
                )
            )
            db.commit()
            regeneration_feedback = (
                "Your previous response was not valid JSON matching the required schema. "
                "Return ONLY a valid JSON object matching the schema exactly."
            )
            continue

        dup_result = evaluate_duplicate(
            candidate_title=parsed.title,
            candidate_hook=parsed.hook,
            candidate_summary=parsed.summary,
            candidate_location=parsed.location,
            candidate_ending=parsed.ending,
            candidate_signature=parsed.signature,
            previous_stories=previous_stories,
            threshold=settings.DUPLICATE_THRESHOLD,
        )

        if dup_result.is_duplicate:
            db.add(
                GenerationLog(
                    category_id=category.id,
                    story_id=existing_story.id if existing_story else None,
                    generation_attempt=attempt,
                    model=result.model,
                    prompt_tokens=result.prompt_tokens,
                    completion_tokens=result.completion_tokens,
                    duplicate_score=dup_result.similarity_score,
                    status="REJECTED_DUPLICATE",
                )
            )
            db.commit()
            last_error = (
                f"Story was rejected as a duplicate (similarity {dup_result.similarity_score}%) "
                f"after {attempt} attempt(s): {dup_result.reason}"
            )
            if attempt < max_attempts:
                regeneration_feedback = (
                    "The previous generated story was too similar to an existing story. "
                    "Generate a substantially different premise, location, conflict, hook and ending."
                )
                continue
            break

        story = _persist_story(
            db,
            category,
            episode_number,
            parsed,
            dup_result.similarity_score,
            ai_provider=getattr(provider, "provider_name", request.ai_provider or settings.AI_PROVIDER),
            ai_model=result.model,
            existing_story=existing_story,
        )
        db.add(
            GenerationLog(
                category_id=category.id,
                story_id=story.id,
                generation_attempt=attempt,
                model=result.model,
                prompt_tokens=result.prompt_tokens,
                completion_tokens=result.completion_tokens,
                duplicate_score=dup_result.similarity_score,
                status="ACCEPTED",
            )
        )
        db.commit()
        db.refresh(story)
        return story

    raise StoryGenerationError(last_error or "Failed to generate a unique story after maximum attempts.")


async def regenerate_scene(
    db: Session,
    story: Story,
    scene: Scene,
    provider: AIProvider | None = None,
    ai_provider: str | None = None,
) -> Scene:
    """Regenerate a single scene, retaining characters/location/wardrobe continuity with neighboring scenes."""
    provider = provider or get_ai_provider(ai_provider)
    category = story.category

    all_scenes = sorted(story.scenes, key=lambda s: s.scene_number)
    prev_scene = next((s for s in all_scenes if s.scene_number == scene.scene_number - 1), None)
    next_scene = next((s for s in all_scenes if s.scene_number == scene.scene_number + 1), None)

    system_prompt = (
        "You are an expert short-form video story writer. You will regenerate ONE scene within an existing "
        "story, keeping characters, wardrobe, location continuity and tone consistent with the rest of the story.\n"
        f"Category custom instructions:\n{category.custom_instructions or 'None provided.'}\n\n"
        "Respond with ONLY a valid JSON object matching exactly this schema:\n"
        "{\n"
        '  "scene_number": integer,\n'
        '  "duration_seconds": integer,\n'
        '  "location": string,\n'
        '  "visual_description": string,\n'
        '  "dialogue": [string],\n'
        '  "camera": string,\n'
        '  "music_sfx": string\n'
        "}\n"
    )

    user_prompt_parts = [
        f"Story title: {story.title}",
        f"Story summary: {story.summary}",
        f"Characters: {json.loads(story.characters_json) if story.characters_json else []}",
        f"Scene to regenerate: scene_number={scene.scene_number}, current location={scene.location}",
    ]
    if prev_scene:
        user_prompt_parts.append(
            f"Previous scene ({prev_scene.scene_number}): location={prev_scene.location}, "
            f"visual={prev_scene.visual_description}"
        )
    if next_scene:
        user_prompt_parts.append(
            f"Next scene ({next_scene.scene_number}): location={next_scene.location}, "
            f"visual={next_scene.visual_description}"
        )
    user_prompt_parts.append(
        "Generate a fresh version of ONLY this scene. Keep the same scene_number. "
        "Maintain wardrobe/location continuity with neighboring scenes unless the story requires a location change."
    )

    result = await provider.generate_story(system_prompt, "\n".join(user_prompt_parts))
    try:
        data = json.loads(result.content)
    except json.JSONDecodeError as exc:
        raise StoryGenerationError(f"AI returned invalid JSON for scene regeneration: {exc}") from exc

    scene.duration_seconds = data.get("duration_seconds", scene.duration_seconds)
    scene.location = data.get("location", scene.location)
    scene.visual_description = data.get("visual_description", scene.visual_description)
    scene.dialogue_json = json.dumps(data.get("dialogue", []))
    scene.camera = data.get("camera", scene.camera)
    scene.music_sfx = data.get("music_sfx", scene.music_sfx)

    db.add(
        GenerationLog(
            category_id=category.id,
            story_id=story.id,
            generation_attempt=1,
            model=result.model,
            prompt_tokens=result.prompt_tokens,
            completion_tokens=result.completion_tokens,
            status="SCENE_REGENERATED",
        )
    )
    db.commit()
    db.refresh(scene)
    return scene
