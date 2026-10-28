from fastapi import APIRouter, Depends
import aiosqlite
from datetime import datetime, timezone, date
from app.database import get_db
from app.models import PomodoroLog

router = APIRouter(prefix="/api/pomodoro", tags=["Pomodoro Timer & Focus"])

@router.post("/log")
async def log_pomodoro_session(session: PomodoroLog, db: aiosqlite.Connection = Depends(get_db)):
    """Logs a completed Pomodoro session."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    cursor = await db.execute(
        """INSERT INTO pomodoro_sessions (duration_minutes, mode, subject, notes, completed_at)
           VALUES (?, ?, ?, ?, ?)""",
        (session.duration_minutes, session.mode, session.subject, session.notes, now)
    )
    await db.commit()
    return {"message": "Session logged successfully", "id": cursor.lastrowid}

@router.get("/sessions")
async def get_pomodoro_sessions(limit: int = 15, db: aiosqlite.Connection = Depends(get_db)):
    """Retrieve recent Pomodoro focus sessions."""
    async with db.execute(
        "SELECT * FROM pomodoro_sessions ORDER BY id DESC LIMIT ?", (limit,)
    ) as cursor:
        rows = await cursor.fetchall()
        return [
            {
                "id": r["id"],
                "duration_minutes": r["duration_minutes"],
                "mode": r["mode"],
                "subject": r["subject"],
                "notes": r["notes"],
                "completed_at": r["completed_at"]
            } for r in rows
        ]

@router.get("/stats")
async def get_pomodoro_stats(db: aiosqlite.Connection = Depends(get_db)):
    """Calculate focus minutes today, total work sessions, and streaks."""
    today_str = date.today().strftime("%Y-%m-%d")
    
    # Minutes today
    async with db.execute(
        "SELECT SUM(duration_minutes) as today_mins FROM pomodoro_sessions WHERE mode = 'work' AND completed_at LIKE ?;",
        (f"{today_str}%",)
    ) as cursor:
        row = await cursor.fetchone()
        today_mins = row["today_mins"] or 0

    # Total all-time minutes
    async with db.execute(
        "SELECT SUM(duration_minutes) as total_mins, COUNT(id) as total_sessions FROM pomodoro_sessions WHERE mode = 'work';"
    ) as cursor:
        row = await cursor.fetchone()
        total_mins = row["total_mins"] or 0
        total_sessions = row["total_sessions"] or 0

    return {
        "today_focus_minutes": today_mins,
        "total_focus_minutes": total_mins,
        "total_work_sessions": total_sessions,
        "today_hours": round(today_mins / 60.0, 1)
    }
