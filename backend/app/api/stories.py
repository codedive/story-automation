"""Story CRUD + generation/regeneration API."""
import json

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.category import Category
from app.models.story import Story, StoryStatus
from app.schemas.story import StoryGenerateRequest, StoryListItem, StoryManualCreate, StoryRead, StoryUpdate
from app.services.serializers import story_to_list_item, story_to_read
from app.services.story_generator import StoryGenerationError, generate_story, get_next_episode_number

router = APIRouter(prefix="/api", tags=["stories"], dependencies=[Depends(get_current_user)])


@router.get("/categories/{category_id}/stories", response_model=list[StoryListItem])
def list_stories(
    category_id: int,
    search: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    sort: str = Query("newest"),
    db: Session = Depends(get_db),
):
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")

    query = db.query(Story).filter(Story.category_id == category_id)

    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                Story.title.ilike(like),
                Story.summary.ilike(like),
                Story.hook.ilike(like),
                Story.location.ilike(like),
                Story.story_text.ilike(like),
            )
        )

    if status_filter and status_filter.upper() != "ALL":
        try:
            query = query.filter(Story.status == StoryStatus(status_filter.upper()))
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status filter.")

    if sort == "oldest":
        query = query.order_by(Story.episode_number.asc())
    elif sort == "title":
        query = query.order_by(Story.title.asc())
    else:
        query = query.order_by(Story.episode_number.desc())

    stories = query.all()
    return [story_to_list_item(s) for s in stories]


@router.post("/categories/{category_id}/stories/generate", response_model=StoryRead, status_code=status.HTTP_201_CREATED)
async def generate_new_story(category_id: int, payload: StoryGenerateRequest, db: Session = Depends(get_db)):
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")
    try:
        story = await generate_story(db, category, payload)
    except StoryGenerationError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return story_to_read(story)


@router.post("/categories/{category_id}/stories/manual", response_model=StoryRead, status_code=status.HTTP_201_CREATED)
def create_manual_story(category_id: int, payload: StoryManualCreate, db: Session = Depends(get_db)):
    """Add a story by hand (no AI call) so it still counts toward this category's duplicate-detection history."""
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")
    story = Story(
        category_id=category_id,
        episode_number=get_next_episode_number(db, category_id),
        title=payload.title,
        hook=payload.hook,
        summary=payload.summary,
        story_text=payload.story_text,
        ending=payload.ending,
        location=payload.location,
        mood=payload.mood,
        status=payload.status,
        similarity_score=0.0,
        signature_json=payload.signature.model_dump_json(),
        characters_json=json.dumps(payload.characters),
        ai_provider="manual",
        ai_model=None,
    )
    db.add(story)
    db.commit()
    db.refresh(story)
    return story_to_read(story)


@router.get("/stories", response_model=list[StoryListItem])
def list_all_stories(db: Session = Depends(get_db)):
    stories = db.query(Story).order_by(Story.created_at.desc()).all()
    return [story_to_list_item(s) for s in stories]


@router.get("/stories/{story_id}", response_model=StoryRead)
def get_story(story_id: int, db: Session = Depends(get_db)):
    story = db.get(Story, story_id)
    if story is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found.")
    return story_to_read(story)


@router.put("/stories/{story_id}", response_model=StoryRead)
def update_story(story_id: int, payload: StoryUpdate, db: Session = Depends(get_db)):
    story = db.get(Story, story_id)
    if story is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found.")
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(story, field, value)
    db.commit()
    db.refresh(story)
    return story_to_read(story)


@router.delete("/stories/{story_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_story(story_id: int, db: Session = Depends(get_db)):
    story = db.get(Story, story_id)
    if story is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found.")
    db.delete(story)
    db.commit()
    return None


@router.post("/stories/{story_id}/regenerate", response_model=StoryRead)
async def regenerate_story(story_id: int, payload: StoryGenerateRequest | None = None, db: Session = Depends(get_db)):
    story = db.get(Story, story_id)
    if story is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Story not found.")
    category = db.get(Category, story.category_id)
    request = payload or StoryGenerateRequest()
    try:
        updated = await generate_story(db, category, request, existing_story=story)
    except StoryGenerationError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return story_to_read(updated)
