"""FastAPI application entrypoint."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import categories, scenes, stories
from app.core.config import settings

app = FastAPI(title="AI Story Factory API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(categories.router)
app.include_router(stories.router)
app.include_router(scenes.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
