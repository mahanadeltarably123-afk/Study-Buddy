from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Body
import aiosqlite
import json
import os
import shutil
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.database import get_db

router = APIRouter(tags=["Lectures & Workspaces"])

class WorkspaceModel(BaseModel):
    id: str
    name: str
    color: Optional[str] = "#4C6FFF"

class LectureCreateModel(BaseModel):
    id: str
    workspaceId: str
    metadata: Dict[str, Any]
    summary: str
    transcript: Any
    keyPoints: List[str]
    flashcards: List[Dict[str, Any]]
    quiz: List[Dict[str, Any]]
    mindMap: Optional[str] = None

@router.get("/users/me")
async def read_users_me():
    return {
        "id": "user_default",
        "name": "Study Buddy Scholar",
        "email": "student@studybuddy.ai",
        "picture": "https://api.dicebear.com/7.x/bottts/svg?seed=Buddy",
        "isGuest": False
    }

@router.post("/auth/login")
async def login(payload: dict = Body(default={})):
    return {
        "status": "success",
        "user": {
            "id": "user_default",
            "name": payload.get("name", "Study Buddy Scholar"),
            "email": payload.get("email", "student@studybuddy.ai"),
            "picture": "https://api.dicebear.com/7.x/bottts/svg?seed=Buddy"
        }
    }

@router.get("/workspaces")
async def get_workspaces(db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("SELECT id, name, color FROM workspaces ORDER BY created_at ASC") as cursor:
        rows = await cursor.fetchall()
        if not rows:
            # Insert default workspace if empty
            await db.execute("INSERT OR IGNORE INTO workspaces (id, name, color) VALUES ('cs101', 'Computer Science', '#8B5CF6')")
            await db.commit()
            return [{"id": "cs101", "name": "Computer Science", "color": "#8B5CF6"}]
        return [{"id": r["id"], "name": r["name"], "color": r["color"]} for r in rows]

@router.post("/workspaces")
async def create_workspace(ws: WorkspaceModel, db: aiosqlite.Connection = Depends(get_db)):
    await db.execute(
        "INSERT INTO workspaces (id, name, color) VALUES (?, ?, ?)",
        (ws.id, ws.name, ws.color)
    )
    await db.commit()
    return {"status": "success", "workspace": ws.dict()}

@router.delete("/workspaces/{workspace_id}")
async def delete_workspace(workspace_id: str, db: aiosqlite.Connection = Depends(get_db)):
    if workspace_id == "cs101" or workspace_id == "default":
        raise HTTPException(status_code=400, detail="Cannot delete default workspace")
    await db.execute("DELETE FROM workspaces WHERE id = ?", (workspace_id,))
    await db.commit()
    return {"status": "success"}

@router.get("/lectures")
async def get_lectures(db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("SELECT data_json FROM lectures ORDER BY created_at DESC") as cursor:
        rows = await cursor.fetchall()
        result = []
        for r in rows:
            try:
                result.append(json.loads(r["data_json"]))
            except Exception:
                continue
        return result

@router.post("/lectures")
async def create_lecture(lecture: LectureCreateModel, db: aiosqlite.Connection = Depends(get_db)):
    title = lecture.metadata.get("title", "Untitled Lecture")
    raw_data = json.dumps(lecture.dict())
    await db.execute(
        "INSERT OR REPLACE INTO lectures (id, workspace_id, title, data_json) VALUES (?, ?, ?, ?)",
        (lecture.id, lecture.workspaceId, title, raw_data)
    )
    await db.commit()
    return {"status": "success", "id": lecture.id}

@router.post("/ingest")
async def ingest_file(file: UploadFile = File(...)):
    """Receives and processes uploaded lecture media or document."""
    upload_dir = os.path.join("data", "raw_media")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    transcription = f"Transcription extracted from uploaded {file.filename}."
    chunks = [transcription]
    
    return {
        "status": "success",
        "transcription": transcription,
        "chunks": chunks
    }
