from fastapi import APIRouter, Depends, HTTPException
import aiosqlite
from datetime import datetime, timezone, date
from app.database import get_db
from app.models import StudyGoalCreate, SettingsUpdate
from app.config import settings

router = APIRouter(prefix="/api/stats", tags=["Dashboard & Analytics"])

@router.get("/dashboard")
async def get_dashboard_summary(db: aiosqlite.Connection = Depends(get_db)):
    """Full aggregated metrics for the study dashboard."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    today_str = date.today().strftime("%Y-%m-%d")

    # Decks & Cards
    async with db.execute("SELECT COUNT(id) as count FROM decks;") as c:
        total_decks = (await c.fetchone())["count"] or 0

    async with db.execute("SELECT COUNT(id) as count FROM cards;") as c:
        total_cards = (await c.fetchone())["count"] or 0

    async with db.execute("SELECT COUNT(id) as count FROM cards WHERE due_date <= ?;", (now,)) as c:
        due_cards = (await c.fetchone())["count"] or 0

    # Notes
    async with db.execute("SELECT COUNT(id) as count FROM notes;") as c:
        total_notes = (await c.fetchone())["count"] or 0

    # Quizzes
    async with db.execute("SELECT COUNT(id) as count, AVG(score * 100.0 / CASE WHEN total_questions > 0 THEN total_questions ELSE 1 END) as avg_score FROM quizzes;") as c:
        row = await c.fetchone()
        total_quizzes = row["count"] or 0
        avg_score = round(row["avg_score"] or 0.0, 1)

    # Focus time
    async with db.execute(
        "SELECT SUM(duration_minutes) as mins FROM pomodoro_sessions WHERE mode = 'work' AND completed_at LIKE ?;",
        (f"{today_str}%",)
    ) as c:
        focus_mins_today = (await c.fetchone())["mins"] or 0

    return {
        "total_decks": total_decks,
        "total_cards": total_cards,
        "due_cards": due_cards,
        "total_notes": total_notes,
        "total_quizzes": total_quizzes,
        "avg_quiz_score": avg_score,
        "focus_mins_today": focus_mins_today,
        "focus_hours_today": round(focus_mins_today / 60.0, 1)
    }

# ================= Study Goals =================
goals_router = APIRouter(prefix="/api/goals", tags=["Study Goals"])

@goals_router.get("")
async def list_goals(db: aiosqlite.Connection = Depends(get_db)):
    """List all study goals and milestones."""
    async with db.execute("SELECT * FROM study_goals ORDER BY is_completed ASC, id DESC") as cursor:
        rows = await cursor.fetchall()
        return [
            {
                "id": r["id"],
                "title": r["title"],
                "target_hours": r["target_hours"],
                "current_hours": r["current_hours"],
                "target_date": r["target_date"],
                "is_completed": bool(r["is_completed"]),
                "progress_percentage": min(100, round((r["current_hours"] / max(0.1, r["target_hours"])) * 100, 1))
            } for r in rows
        ]

@goals_router.post("")
async def create_goal(goal: StudyGoalCreate, db: aiosqlite.Connection = Depends(get_db)):
    """Create a new study milestone or goal."""
    cursor = await db.execute(
        "INSERT INTO study_goals (title, target_hours, current_hours, target_date, is_completed) VALUES (?, ?, 0, ?, 0)",
        (goal.title, goal.target_hours, goal.target_date or "")
    )
    await db.commit()
    return {"message": "Goal created", "id": cursor.lastrowid}

@goals_router.put("/{goal_id}/toggle")
async def toggle_goal(goal_id: int, db: aiosqlite.Connection = Depends(get_db)):
    """Toggle goal completion state."""
    async with db.execute("SELECT is_completed FROM study_goals WHERE id = ?", (goal_id,)) as cursor:
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Goal not found")
        new_status = 0 if row["is_completed"] else 1

    await db.execute("UPDATE study_goals SET is_completed = ? WHERE id = ?", (new_status, goal_id))
    await db.commit()
    return {"id": goal_id, "is_completed": bool(new_status)}

@goals_router.delete("/{goal_id}")
async def delete_goal(goal_id: int, db: aiosqlite.Connection = Depends(get_db)):
    """Delete a goal."""
    await db.execute("DELETE FROM study_goals WHERE id = ?", (goal_id,))
    await db.commit()
    return {"message": "Goal deleted"}

# ================= Settings Endpoints =================
settings_router = APIRouter(prefix="/api/settings", tags=["Application Settings"])

@settings_router.get("")
async def get_current_settings():
    """Retrieve runtime settings and active AI configuration."""
    return {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "default_ai_provider": settings.DEFAULT_AI_PROVIDER,
        "has_gemini_key": bool(settings.GEMINI_API_KEY),
        "has_openai_key": bool(settings.OPENAI_API_KEY),
        "has_groq_key": bool(settings.GROQ_API_KEY),
        "ollama_base_url": settings.OLLAMA_BASE_URL
    }

@settings_router.post("")
async def update_settings(update: SettingsUpdate):
    """Update runtime AI provider and API keys."""
    if update.ai_provider:
        settings.DEFAULT_AI_PROVIDER = update.ai_provider
    if update.gemini_api_key is not None:
        settings.GEMINI_API_KEY = update.gemini_api_key
    if update.openai_api_key is not None:
        settings.OPENAI_API_KEY = update.openai_api_key
    if update.groq_api_key is not None:
        settings.GROQ_API_KEY = update.groq_api_key
    if update.ollama_base_url is not None:
        settings.OLLAMA_BASE_URL = update.ollama_base_url

    return {"message": "Settings updated successfully", "active_provider": settings.DEFAULT_AI_PROVIDER}
