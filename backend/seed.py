"""Optional seed script: creates default categories (no fake generated stories).

Run with:
    python seed.py
"""
from app.core.database import SessionLocal
from app.models.category import Category

RAJ_SIMRAN_INSTRUCTIONS = """Characters:
Raj: 25-year-old Indian man.
Simran: 23-year-old Indian woman.

Rules:
- Same recurring characters (Raj & Simran) across every episode.
- Hindi dialogue.
- No narrator.
- 9:16 YouTube Shorts format.
- Approximately 60 seconds.
- 7-8 scenes.
- Strong first 2-3 second hook.
- Romantic chemistry with cute nok-jhok (playful bickering).
- Emotional payoff and a memorable final line.
- Location should vary between episodes (restaurant, lake, cafe, beach, rooftop,
  village, fair, hill station, bookstore, garden, resort, train journey, road trip,
  festival, shopping mall, terrace, mountain cabin). Do not always pick the same location.
- Wardrobe should vary between episodes but remain consistent within a single episode.
- Romance intensity should vary between episodes."""

SEED_CATEGORIES = [
    {
        "name": "Raj Simran Loveverse",
        "description": "Romantic stories for Raj & Simran",
        "default_language": "Hindi",
        "default_duration": "60 Seconds",
        "visual_style": "Semi-Realistic 2D",
        "custom_instructions": RAJ_SIMRAN_INSTRUCTIONS,
    },
    {
        "name": "Moral Stories",
        "description": "Short moral stories with a clear life lesson.",
        "default_language": "English",
        "default_duration": "60 Seconds",
        "visual_style": "2D Animated",
        "custom_instructions": (
            "Each story must teach a clear, simple moral lesson. Keep tone warm and age-appropriate. "
            "End with the lesson stated briefly but not preachy."
        ),
    },
    {
        "name": "Kids Stories",
        "description": "Fun, imaginative stories for young children.",
        "default_language": "English",
        "default_duration": "2 Minutes",
        "visual_style": "3D Animated",
        "custom_instructions": (
            "Use simple vocabulary suitable for children aged 4-8. Include friendly characters, "
            "gentle humor, and a positive, happy ending."
        ),
    },
]


def run_seed() -> None:
    db = SessionLocal()
    try:
        for data in SEED_CATEGORIES:
            existing = db.query(Category).filter(Category.name == data["name"]).first()
            if existing:
                print(f"Skipping existing category: {data['name']}")
                continue
            category = Category(**data)
            db.add(category)
            print(f"Created category: {data['name']}")
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
