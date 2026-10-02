"""Category CRUD API."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.category import Category
from app.models.story import Story
from app.schemas.category import CategoryCreate, CategoryRead, CategorySummary, CategoryUpdate
from app.services.serializers import category_to_summary

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", response_model=list[CategorySummary])
def list_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).order_by(Category.created_at.asc()).all()
    results = []
    for category in categories:
        story_count = db.query(func.count(Story.id)).filter(Story.category_id == category.id).scalar() or 0
        last_generated_at = (
            db.query(func.max(Story.created_at)).filter(Story.category_id == category.id).scalar()
        )
        results.append(category_to_summary(category, story_count, last_generated_at))
    return results


@router.post("", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(Category).filter(Category.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A category with this name already exists.")
    category = Category(**payload.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.get("/{category_id}", response_model=CategoryRead)
def get_category(category_id: int, db: Session = Depends(get_db)):
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")
    return category


@router.put("/{category_id}", response_model=CategoryRead)
def update_category(category_id: int, payload: CategoryUpdate, db: Session = Depends(get_db)):
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")
    update_data = payload.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] != category.name:
        existing = db.query(Category).filter(Category.name == update_data["name"]).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A category with this name already exists.")
    for field, value in update_data.items():
        setattr(category, field, value)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")
    db.delete(category)
    db.commit()
    return None
