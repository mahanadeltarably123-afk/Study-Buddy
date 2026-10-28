from fastapi import APIRouter, Depends, HTTPException
import aiosqlite
from typing import List, Dict
from app.database import get_db
from app.models import TutorMessage, TutorResponse
from app.services.ai_service import AIService, PERSONA_PROMPTS

router = APIRouter(prefix="/api/tutor", tags=["AI Tutor"])

@router.get("/personas")
async def get_personas():
    """List available AI Tutor personas with descriptions."""
    return [
        {"name": "Socratic Tutor", "badge": "💡 Socratic", "description": "Guides through probing questions, real-world analogies, and deductive hints."},
        {"name": "Feynman Explainer", "badge": "🧠 Feynman", "description": "Breaks down complex topics into plain, intuitive analogies without jargon."},
        {"name": "Exam Coach", "badge": "🎯 Exam Coach", "description": "High-yield test prep, mnemonics, common traps, and rapid active-recall drills."},
        {"name": "Code Specialist", "badge": "💻 Code Mentor", "description": "Senior engineer guidance, idiomatic implementations, and Big-O complexity analysis."}
    ]

@router.post("/chat", response_model=TutorResponse)
async def chat_with_tutor(req: TutorMessage, db: aiosqlite.Connection = Depends(get_db)):
    """Interactive multi-turn conversation with the AI Study Tutor."""
    # Fetch recent history for context
    history = []
    async with db.execute(
        "SELECT role, content FROM tutor_history WHERE session_id = ? ORDER BY id ASC LIMIT 10",
        (req.session_id,)
    ) as cursor:
        rows = await cursor.fetchall()
        for r in rows:
            history.append({"role": r["role"], "content": r["content"]})

    # Save user message
    await db.execute(
        "INSERT INTO tutor_history (session_id, persona, role, content) VALUES (?, ?, 'user', ?)",
        (req.session_id, req.persona, req.message)
    )
    await db.commit()

    # Call AI service
    ai_result = await AIService.ask_tutor(
        message=req.message,
        persona=req.persona or "Socratic Tutor",
        history=history,
        context=req.context or ""
    )

    # Save assistant response
    await db.execute(
        "INSERT INTO tutor_history (session_id, persona, role, content) VALUES (?, ?, 'assistant', ?)",
        (req.session_id, req.persona, ai_result["reply"])
    )
    await db.commit()

    return TutorResponse(
        session_id=req.session_id,
        reply=ai_result["reply"],
        persona=ai_result["persona"],
        provider_used=ai_result["provider_used"]
    )

@router.get("/history/{session_id}")
async def get_chat_history(session_id: str, db: aiosqlite.Connection = Depends(get_db)):
    """Retrieve full conversation history for a session."""
    async with db.execute(
        "SELECT id, persona, role, content, created_at FROM tutor_history WHERE session_id = ? ORDER BY id ASC",
        (session_id,)
    ) as cursor:
        rows = await cursor.fetchall()
        return [
            {
                "id": r["id"],
                "persona": r["persona"],
                "role": r["role"],
                "content": r["content"],
                "created_at": r["created_at"]
            } for r in rows
        ]

@router.delete("/history/{session_id}")
async def clear_chat_history(session_id: str, db: aiosqlite.Connection = Depends(get_db)):
    """Clear conversation history for a session."""
    await db.execute("DELETE FROM tutor_history WHERE session_id = ?", (session_id,))
    await db.commit()
    return {"message": "Chat history cleared"}
