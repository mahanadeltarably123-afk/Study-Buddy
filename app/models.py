from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime

# ================= Flashcard Models =================
class CardBase(BaseModel):
    front: str
    back: str
    hint: Optional[str] = ""

class CardCreate(CardBase):
    deck_id: int

class CardResponse(CardBase):
    id: int
    deck_id: int
    repetition: int
    interval: int
    ease_factor: float
    due_date: str
    created_at: str

class CardReviewGrade(BaseModel):
    card_id: int
    grade: int = Field(..., ge=0, le=3, description="0=Again, 1=Hard, 2=Good, 3=Easy")

class DeckBase(BaseModel):
    title: str
    description: Optional[str] = ""
    icon: Optional[str] = "📚"
    color: Optional[str] = "indigo"

class DeckCreate(DeckBase):
    pass

class DeckResponse(DeckBase):
    id: int
    created_at: str
    card_count: Optional[int] = 0
    due_count: Optional[int] = 0

# ================= Note Models =================
class NoteBase(BaseModel):
    title: str
    content: str
    category: Optional[str] = "General"
    tags: Optional[str] = ""

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None
    summary: Optional[str] = None

class NoteResponse(NoteBase):
    id: int
    summary: Optional[str] = ""
    created_at: str
    updated_at: str

class NoteSummarizeRequest(BaseModel):
    note_id: Optional[int] = None
    content: Optional[str] = None
    style: Optional[Literal["bullet_points", "tldr", "feynman", "mindmap"]] = "bullet_points"

# ================= AI Tutor Models =================
class TutorMessage(BaseModel):
    session_id: str
    persona: Optional[str] = "Socratic Tutor"
    message: str
    context: Optional[str] = ""

class TutorResponse(BaseModel):
    session_id: str
    reply: str
    persona: str
    provider_used: str

class GenerateCardsRequest(BaseModel):
    deck_id: int
    topic_or_content: str
    count: Optional[int] = 5

class GenerateQuizRequest(BaseModel):
    topic_or_content: str
    num_questions: Optional[int] = 5
    difficulty: Optional[str] = "medium"

class QuizQuestion(BaseModel):
    id: int
    question: str
    options: List[str]
    correct_index: int
    explanation: str

class QuizSubmit(BaseModel):
    quiz_id: Optional[int] = None
    answers: dict  # {question_id: selected_index}

# ================= Pomodoro & Goals =================
class PomodoroLog(BaseModel):
    duration_minutes: int
    mode: Literal["work", "short_break", "long_break"]
    subject: Optional[str] = "General Study"
    notes: Optional[str] = ""

class StudyGoalCreate(BaseModel):
    title: str
    target_hours: float
    target_date: Optional[str] = ""

class SettingsUpdate(BaseModel):
    ai_provider: Optional[str] = None
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    ollama_base_url: Optional[str] = None
