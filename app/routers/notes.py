from fastapi import APIRouter, Depends, HTTPException
import aiosqlite
from typing import List
from datetime import datetime, timezone
from app.database import get_db
from app.models import NoteCreate, NoteUpdate, NoteResponse, NoteSummarizeRequest
from app.services.ai_service import AIService

router = APIRouter(prefix="/api/notes", tags=["Notes & Summaries"])

@router.get("", response_model=List[NoteResponse])
async def list_notes(category: str = None, db: aiosqlite.Connection = Depends(get_db)):
    """List notes, optionally filtered by category."""
    query = "SELECT * FROM notes"
    params = []
    if category:
        query += " WHERE category = ?"
        params.append(category)
    query += " ORDER BY updated_at DESC;"
    
    async with db.execute(query, params) as cursor:
        rows = await cursor.fetchall()
        return [
            NoteResponse(
                id=r["id"],
                title=r["title"],
                content=r["content"],
                category=r["category"] or "General",
                summary=r["summary"] or "",
                tags=r["tags"] or "",
                created_at=r["created_at"],
                updated_at=r["updated_at"]
            ) for r in rows
        ]

@router.post("", response_model=NoteResponse)
async def create_note(note: NoteCreate, db: aiosqlite.Connection = Depends(get_db)):
    """Create a new note."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    cursor = await db.execute(
        """INSERT INTO notes (title, content, category, summary, tags, created_at, updated_at)
           VALUES (?, ?, ?, '', ?, ?, ?)""",
        (note.title, note.content, note.category, note.tags, now, now)
    )
    await db.commit()
    note_id = cursor.lastrowid
    
    async with db.execute("SELECT * FROM notes WHERE id = ?", (note_id,)) as cursor:
        row = await cursor.fetchone()
        return NoteResponse(
            id=row["id"],
            title=row["title"],
            content=row["content"],
            category=row["category"],
            summary=row["summary"],
            tags=row["tags"],
            created_at=row["created_at"],
            updated_at=row["updated_at"]
        )

@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(note_id: int, db: aiosqlite.Connection = Depends(get_db)):
    """Retrieve a note by ID."""
    async with db.execute("SELECT * FROM notes WHERE id = ?", (note_id,)) as cursor:
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Note not found")
        return NoteResponse(
            id=row["id"],
            title=row["title"],
            content=row["content"],
            category=row["category"],
            summary=row["summary"],
            tags=row["tags"],
            created_at=row["created_at"],
            updated_at=row["updated_at"]
        )

@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(note_id: int, update: NoteUpdate, db: aiosqlite.Connection = Depends(get_db)):
    """Update note details."""
    async with db.execute("SELECT * FROM notes WHERE id = ?", (note_id,)) as cursor:
        current = await cursor.fetchone()
        if not current:
            raise HTTPException(status_code=404, detail="Note not found")

    title = update.title if update.title is not None else current["title"]
    content = update.content if update.content is not None else current["content"]
    category = update.category if update.category is not None else current["category"]
    tags = update.tags if update.tags is not None else current["tags"]
    summary = update.summary if update.summary is not None else current["summary"]
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

    await db.execute(
        """UPDATE notes 
           SET title = ?, content = ?, category = ?, tags = ?, summary = ?, updated_at = ?
           WHERE id = ?""",
        (title, content, category, tags, summary, now, note_id)
    )
    await db.commit()

    async with db.execute("SELECT * FROM notes WHERE id = ?", (note_id,)) as cursor:
        row = await cursor.fetchone()
        return NoteResponse(
            id=row["id"],
            title=row["title"],
            content=row["content"],
            category=row["category"],
            summary=row["summary"],
            tags=row["tags"],
            created_at=row["created_at"],
            updated_at=row["updated_at"]
        )

@router.delete("/{note_id}")
async def delete_note(note_id: int, db: aiosqlite.Connection = Depends(get_db)):
    """Delete a note."""
    await db.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    await db.commit()
    return {"message": "Note deleted successfully"}

@router.post("/summarize")
async def summarize_note(req: NoteSummarizeRequest, db: aiosqlite.Connection = Depends(get_db)):
    """Summarizes note text using AI and optionally saves it."""
    text_to_summarize = req.content or ""
    if req.note_id and not text_to_summarize:
        async with db.execute("SELECT content FROM notes WHERE id = ?", (req.note_id,)) as cursor:
            row = await cursor.fetchone()
            if row:
                text_to_summarize = row["content"]

    if not text_to_summarize.strip():
        raise HTTPException(status_code=400, detail="No content provided to summarize")

    summary = await AIService.summarize_text(text_to_summarize, style=req.style or "bullet_points")
    
    if req.note_id:
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        await db.execute("UPDATE notes SET summary = ?, updated_at = ? WHERE id = ?", (summary, now, req.note_id))
        await db.commit()

    return {"summary": summary, "style": req.style}
