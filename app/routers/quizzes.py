from fastapi import APIRouter, Depends, HTTPException
import aiosqlite
import json
from typing import List
from datetime import datetime
from app.database import get_db
from app.models import GenerateQuizRequest
from app.services.ai_service import AIService

router = APIRouter(prefix="/api/quizzes", tags=["Interactive Quizzes"])

@router.post("/generate")
async def generate_quiz(req: GenerateQuizRequest, db: aiosqlite.Connection = Depends(get_db)):
    """Generate an active recall multiple-choice quiz based on topic or notes."""
    questions = await AIService.generate_quiz(
        topic_or_content=req.topic_or_content,
        num_questions=req.num_questions or 5,
        difficulty=req.difficulty or "medium"
    )
    
    title = f"Quiz: {req.topic_or_content[:40]}"
    cursor = await db.execute(
        """INSERT INTO quizzes (title, topic, score, total_questions, questions_json)
           VALUES (?, ?, 0, ?, ?)""",
        (title, req.topic_or_content, len(questions), json.dumps(questions))
    )
    await db.commit()
    quiz_id = cursor.lastrowid
    
    return {
        "quiz_id": quiz_id,
        "title": title,
        "total_questions": len(questions),
        "questions": questions
    }

@router.get("")
async def list_quizzes(db: aiosqlite.Connection = Depends(get_db)):
    """List all quizzes and recent attempts."""
    async with db.execute("SELECT id, title, topic, score, total_questions, created_at FROM quizzes ORDER BY id DESC") as cursor:
        rows = await cursor.fetchall()
        return [
            {
                "id": r["id"],
                "title": r["title"],
                "topic": r["topic"],
                "score": r["score"],
                "total_questions": r["total_questions"],
                "created_at": r["created_at"]
            } for r in rows
        ]

@router.get("/{quiz_id}")
async def get_quiz(quiz_id: int, db: aiosqlite.Connection = Depends(get_db)):
    """Get full quiz details and questions."""
    async with db.execute("SELECT * FROM quizzes WHERE id = ?", (quiz_id,)) as cursor:
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Quiz not found")
        return {
            "id": row["id"],
            "title": row["title"],
            "topic": row["topic"],
            "score": row["score"],
            "total_questions": row["total_questions"],
            "questions": json.loads(row["questions_json"]),
            "created_at": row["created_at"]
        }

@router.post("/{quiz_id}/submit")
async def submit_quiz(quiz_id: int, submission: dict, db: aiosqlite.Connection = Depends(get_db)):
    """
    Evaluates quiz submission.
    submission: { "answers": { "1": 0, "2": 2, ... } } mapping question id to chosen index
    """
    async with db.execute("SELECT * FROM quizzes WHERE id = ?", (quiz_id,)) as cursor:
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Quiz not found")
        questions = json.loads(row["questions_json"])

    user_answers = submission.get("answers", {})
    score = 0
    feedback = []

    for q in questions:
        qid_str = str(q["id"])
        selected_idx = user_answers.get(qid_str)
        is_correct = selected_idx == q["correct_index"]
        if is_correct:
            score += 1
            
        feedback.append({
            "question_id": q["id"],
            "question": q["question"],
            "selected_index": selected_idx,
            "correct_index": q["correct_index"],
            "is_correct": is_correct,
            "explanation": q["explanation"]
        })

    # Update saved score
    await db.execute("UPDATE quizzes SET score = ? WHERE id = ?", (score, quiz_id))
    await db.commit()

    return {
        "quiz_id": quiz_id,
        "score": score,
        "total_questions": len(questions),
        "percentage": round((score / max(1, len(questions))) * 100, 1),
        "feedback": feedback
    }
