# 🎓 Study Buddy — Intelligent AI Study Companion & Learning Suite

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mahanadeltarably123-afk/Study-Buddy&env=VITE_GEMINI_API_KEY,VITE_GOOGLE_CLIENT_ID)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.2+-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2+-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Docker Ready](https://img.shields.io/badge/Docker-compose%20ready-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)

> **The all-in-one unified study platform combining interactive React 19 UI, SuperMemo SM-2 Spaced Repetition, Multi-Persona AI Tutors, Smart Notes Summarizer, Pomodoro focus mode, RAG lecture intelligence, and Student Tracking analytics.**

---

## 🌟 Key Features

### 1. 🗂️ SuperMemo SM-2 Spaced Repetition & Flashcards
- Scientific active recall scheduler calculating review intervals and ease factor ($EF$).
- 4-level retention feedback: `Again` (<10m), `Hard` (1 day), `Good` (normal interval), `Easy` (bonus interval).
- Keyboard shortcuts: `Space` to flip, `1`-`4` to grade.

### 2. 🤖 Interactive Multi-Persona AI Tutor
- **Socratic Tutor**: Guides through probing questions and hints without spoiling answers.
- **Feynman Explainer**: Demystifies difficult topics with real-world analogies and zero jargon.
- **Exam Coach**: Drills high-yield points, recall mnemonics, and test traps.
- **Code Specialist**: Senior software engineer guidance with Big-O complexity analysis.
- Multi-provider support (Gemini, OpenAI, Groq, Ollama) plus **built-in zero-config offline engine**.

### 3. ⏱️ Pomodoro Focus Timer
- 25m Deep Work / 5m Short Break / 15m Long Break intervals.
- Soft audio completion chimes and focus metrics tracking.

### 4. 📝 Smart Notes & AI Summarization
- Markdown editor with instant one-click AI processing:
  - **Executive TL;DR**: 2-sentence concept distillation.
  - **Feynman Breakdown**: Plain-language conceptual explanations.
  - **Key Points**: High-yield bullet point extraction.

### 5. 📊 Student Analytics & Hub
- Performance tracking, daily study streaks, attendance logs, and report exports.

### 6. 🗺️ Mind Map Visualizer & Quizzes
- Auto-generated Mermaid.js mind maps and interactive practice quizzes with instant grading.

---

## 🚀 Quick Start

### Frontend (React + Vite)
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Backend (FastAPI + Async SQLite)
```bash
# Install Python dependencies
pip install -r requirements.txt

# Launch FastAPI backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or run the cross-platform script:
```bash
# Mac / Linux
./run.sh

# Windows
run.bat
```

---

## ☁️ Deployment

### 1. Vercel (1-Click)
Deploy the frontend and serverless endpoints in seconds:
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mahanadeltarably123-afk/Study-Buddy&env=VITE_GEMINI_API_KEY,VITE_GOOGLE_CLIENT_ID)

Environment variables:
- `VITE_GEMINI_API_KEY`: Google Gemini API key.
- `VITE_GOOGLE_CLIENT_ID`: (Optional) Google OAuth client ID.

### 2. Docker & Docker Compose
```bash
docker-compose up --build
```
