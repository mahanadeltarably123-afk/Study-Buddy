import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)
DB_PATH = DATA_DIR / "study_buddy.db"

class Settings(BaseModel):
    APP_NAME: str = "Study Buddy"
    APP_VERSION: str = "1.0.0"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")
    DB_URL: str = str(DB_PATH)
    
    # AI Providers Configuration
    DEFAULT_AI_PROVIDER: str = os.getenv("AI_PROVIDER", "heuristic")  # "heuristic", "gemini", "openai", "groq", "ollama"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    
    # Study Defaults
    DEFAULT_POMODORO_WORK_MINS: int = 25
    DEFAULT_POMODORO_BREAK_MINS: int = 5
    DEFAULT_POMODORO_LONG_BREAK_MINS: int = 15

settings = Settings()
