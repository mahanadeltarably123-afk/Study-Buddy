from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
import shutil
from typing import List, Dict, Any

from src.database import engine, Base, get_db
from src.models import User, Lecture, Workspace
from src.auth import get_current_user
from src.transcription.transcribe import transcribe_audio
from src.chunking.chunk import chunk_text
# from src.vectordb.vectordb import VectorStore  # Temporarily disabled
from pydantic import BaseModel

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = ["http://localhost:5173", "http://localhost:3001"]
app.add_middleware(
	CORSMiddleware,
	allow_origins=origins,
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

class LectureCreate(BaseModel):
    id: str
    workspaceId: str
    metadata: Dict[str, Any]
    summary: str
    transcript: Any
    keyPoints: List[str]
    flashcards: List[Dict[str, Any]]
    quiz: List[Dict[str, Any]]
    mindMap: str = None

@app.get("/users/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "picture": current_user.profile_picture,
        "isGuest": False # Since they are logged in
    }

@app.post("/auth/login")
async def login(current_user: User = Depends(get_current_user)):
    # The dependency handles verification and user creation
    return {"status": "success", "user": {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "picture": current_user.profile_picture
    }}

@app.get("/lectures")
async def get_lectures(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    lectures = db.query(Lecture).filter(Lecture.user_id == current_user.id).order_by(Lecture.created_at.desc()).all()
    # Map back to frontend format
    result = []
    for l in lectures:
        data = l.data
        if data:
            # Ensure ID matches database ID or keep frontend ID? 
            # Frontend uses string IDs. Database uses Integer.
            # Let's use the data's ID but maybe update it?
            # Actually, let's just return the data blob which contains everything.
            result.append(data)
    return result

@app.post("/lectures")
async def create_lecture(
    lecture_data: LectureCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if exists (optional)
    
    # Create new lecture
    new_lecture = Lecture(
        user_id=current_user.id,
        title=lecture_data.metadata.get("title", "Untitled"),
        data=lecture_data.dict()
    )
    db.add(new_lecture)
    db.commit()
    db.refresh(new_lecture)
    
    return {"status": "success", "id": new_lecture.id}

@app.get("/workspaces")
async def get_workspaces(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    workspaces = db.query(Workspace).filter(Workspace.user_id == current_user.id).all()
    return [{"id": w.id, "name": w.name, "color": w.color} for w in workspaces]

@app.post("/workspaces")
async def create_workspace(
    workspace: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_workspace = Workspace(
        id=workspace["id"],
        user_id=current_user.id,
        name=workspace["name"],
        color=workspace.get("color", "#4C6FFF")
    )
    db.add(new_workspace)
    db.commit()
    db.refresh(new_workspace)
    
    return {"status": "success", "workspace": {"id": new_workspace.id, "name": new_workspace.name, "color": new_workspace.color}}

@app.delete("/workspaces/{workspace_id}")
async def delete_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    workspace = db.query(Workspace).filter(
        Workspace.id == workspace_id,
        Workspace.user_id == current_user.id
    ).first()
    
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    # Don't allow deleting the default workspace
    if workspace_id == "default":
        raise HTTPException(status_code=400, detail="Cannot delete default workspace")
    
    db.delete(workspace)
    db.commit()
    
    return {"status": "success"}

@app.post("/chat")
async def chat(query: str, current_user: User = Depends(get_current_user)):
	# Step 1: Query RAG engine (placeholder)
	# rag_engine = RAGEngine()
	# response = rag_engine.query(query)
	response = "This is a placeholder answer from the AI."
	return {"answer": response}

@app.post("/ingest")
async def ingest_file(
    file: UploadFile = File(...),
    # current_user: User = Depends(get_current_user) # Temporarily disabled for testing if needed, but best to keep
):
    # 1. Save file
    upload_dir = os.path.join("data", "raw_media")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # 2. Transcribe
    try:
        # Determine if audio/video based on extension or mime
        # For now assume audio/video if not pdf
        if file.filename.endswith('.pdf'):
             # Placeholder for PDF text extraction
             transcription = "PDF content extraction not yet implemented."
        else:
             transcription = transcribe_audio(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

    # 3. Chunk
    chunks = chunk_text(transcription)
    
    # 4. Embed & Store
    # try:
    #     vector_store = VectorStore()
    #     vector_store.add_documents(chunks, metadatas=[{"source": file.filename} for _ in chunks])
    # except Exception as e:
    #     print(f"Vector store error: {e}")
    #     # Continue even if vector store fails, so user gets transcription? 
    #     # Or fail? Let's log and continue for now.

    return {
        "status": "success",
        "transcription": transcription,
        "chunks": chunks
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
