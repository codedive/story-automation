"""Scene update + regeneration API."""
import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.scene import Scene
from app.schemas.scene import SceneRead, SceneRegenerateRequest, SceneUpdate
from app.services.serializers import scene_to_read
from app.services.story_generator import StoryGenerationError, regenerate_scene

router = APIRouter(prefix="/api/scenes", tags=["scenes"], dependencies=[Depends(get_current_user)])


@router.put("/{scene_id}", response_model=SceneRead)
def update_scene(scene_id: int, payload: SceneUpdate, db: Session = Depends(get_db)):
    scene = db.get(Scene, scene_id)
    if scene is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scene not found.")
    update_data = payload.model_dump(exclude_unset=True)
    if "dialogue" in update_data:
        scene.dialogue_json = json.dumps(update_data.pop("dialogue"))
    for field, value in update_data.items():
        setattr(scene, field, value)
    db.commit()
    db.refresh(scene)
    return scene_to_read(scene)


@router.post("/{scene_id}/regenerate", response_model=SceneRead)
async def regenerate_scene_endpoint(scene_id: int, payload: SceneRegenerateRequest | None = None, db: Session = Depends(get_db)):
    scene = db.get(Scene, scene_id)
    if scene is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scene not found.")
    story = scene.story
    try:
        updated = await regenerate_scene(db, story, scene, ai_provider=payload.ai_provider if payload else None)
    except StoryGenerationError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return scene_to_read(updated)
