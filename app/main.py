from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from jinja2 import Environment, FileSystemLoader

from app.config import settings
from app.database import init_db, get_db
from app.services.seed_data import seed_initial_data
from app.routers.flashcards import router as decks_router, cards_router
from app.routers.notes import router as notes_router
from app.routers.tutor import router as tutor_router
from app.routers.quizzes import router as quizzes_router
from app.routers.pomodoro import router as pomodoro_router
from app.routers.stats import router as stats_router, goals_router, settings_router

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"

STATIC_DIR.mkdir(parents=True, exist_ok=True)
TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)

jinja_env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)))

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables and seed sample data
    await init_db()
    async for db in get_db():
        await seed_initial_data(db)
        break
    yield
    # Shutdown

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Intelligent AI-powered Study Buddy for active recall, flashcards, smart notes, Pomodoro, and quizzes.",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Include Routers
app.include_router(decks_router)
app.include_router(cards_router)
app.include_router(notes_router)
app.include_router(tutor_router)
app.include_router(quizzes_router)
app.include_router(pomodoro_router)
app.include_router(stats_router)
app.include_router(goals_router)
app.include_router(settings_router)

@app.get("/health", tags=["Health"])
async def health_check():
    """Healthcheck endpoint for container orchestration and uptime monitoring."""
    return {"status": "healthy", "app": settings.APP_NAME, "version": settings.APP_VERSION}

@app.get("/", response_class=HTMLResponse, tags=["Dashboard"])
async def root(request: Request):
    """Serves the Single Page Application dashboard."""
    template = jinja_env.get_template("index.html")
    return template.render(app_name=settings.APP_NAME, version=settings.APP_VERSION)
