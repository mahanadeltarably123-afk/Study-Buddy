import aiosqlite
from pathlib import Path
from typing import AsyncGenerator
from app.config import settings

CREATE_TABLES_SQL = """
CREATE TABLE IF NOT EXISTS decks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    icon TEXT DEFAULT '📚',
    color TEXT DEFAULT 'indigo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deck_id INTEGER NOT NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    hint TEXT DEFAULT '',
    repetition INTEGER DEFAULT 0,
    interval INTEGER DEFAULT 0,
    ease_factor REAL DEFAULT 2.5,
    due_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    summary TEXT DEFAULT '',
    tags TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    topic TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    questions_json TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    duration_minutes INTEGER NOT NULL,
    mode TEXT NOT NULL, -- 'work', 'short_break', 'long_break'
    subject TEXT DEFAULT 'General Study',
    notes TEXT DEFAULT '',
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tutor_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    persona TEXT DEFAULT 'Socratic Tutor',
    role TEXT NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS study_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    target_hours REAL DEFAULT 1.0,
    current_hours REAL DEFAULT 0.0,
    target_date TEXT DEFAULT '',
    is_completed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

async def get_db() -> AsyncGenerator[aiosqlite.Connection, None]:
    """Database connection generator for dependency injection."""
    db = await aiosqlite.connect(settings.DB_URL)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA foreign_keys = ON;")
    try:
        yield db
    finally:
        await db.close()

async def init_db():
    """Initializes database schema and default tables."""
    Path(settings.DB_URL).parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(settings.DB_URL) as db:
        await db.execute("PRAGMA foreign_keys = ON;")
        await db.executescript(CREATE_TABLES_SQL)
        await db.commit()
