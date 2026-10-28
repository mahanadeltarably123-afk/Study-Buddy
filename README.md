# 🎓 Study Buddy — Intelligent AI Study Companion

[![Python Version](https://img.shields.io/badge/python-3.11%20%7C%203.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Docker Ready](https://img.shields.io/badge/docker-compose%20ready-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests Passing](https://img.shields.io/badge/tests-11%20passed-success.svg)](tests/)

> **Supercharge your learning with Active Recall, Spaced Repetition (SuperMemo SM-2), an interactive multi-persona AI Tutor, Smart Notes Summarizer, Pomodoro focus mode, and self-testing quizzes.**

---

## 🌟 Key Highlights & Enhancements

- 🤖 **Interactive Multi-Persona AI Tutor**:
  - **Socratic Tutor**: Guides you through questions and first-principles deductions rather than handing out answers.
  - **Feynman Explainer**: Demystifies hard topics using intuitive metaphors, everyday analogies, and zero jargon.
  - **Exam Prep Coach**: Drills testable high-yield points, common exam pitfalls, and recall mnemonics.
  - **Code Specialist**: Provides idiomatic implementations, line-by-line breakdowns, and Big-O complexity analysis.
  - **Multi-Provider & Zero-Config Offline Mode**: Seamlessly integrates with Google Gemini, OpenAI (GPT-4o), Groq (Llama 3.3), Ollama (Local LLM), or uses the built-in heuristic offline engine with **zero API key required**.

- 🗂️ **Spaced Repetition & Flashcard Decks (SuperMemo SM-2)**:
  - Scientific active recall scheduler calculating optimal review intervals based on difficulty ratings (`Again`, `Hard`, `Good`, `Easy`).
  - Interactive 3D flip-card experience with keyboard shortcuts (`Space` to flip, `1`-`4` to grade).
  - One-click AI card generation: type any topic or paste lecture notes to auto-generate flashcard decks.

- 📝 **Smart Notes & AI Summarizer**:
  - Clean markdown note-taking editor.
  - Generate bullet-point summaries, executive TL;DRs, Feynman breakdowns, or concept outlines.

- ⏱️ **Pomodoro Study Timer & Focus Metrics**:
  - 25m Focus / 5m Short Break / 15m Long Break intervals with soft audio completion chimes.
  - Automatic focus time logging and daily study analytics.

- 🎯 **Practice Quizzes & Mastery Tests**:
  - Auto-generated multiple-choice practice tests with instant grading and detailed explanations.

---

## 🏛️ System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                 Modern SPA Dashboard (HTML5 / Tailwind)      │
│  [Dashboard] [Flashcards & SM-2] [AI Tutor] [Notes] [Timer]  │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API (JSON / HTTP)
┌──────────────────────────────▼──────────────────────────────┐
│                    FastAPI Backend Core                     │
│  ├── Routers: /api/decks, /api/cards, /api/tutor, /api/notes│
│  │            /api/quizzes, /api/pomodoro, /api/stats       │
│  ├── Services: Spaced Repetition (SM-2), AI Orchestrator   │
│  └── Storage: Async SQLite (aiosqlite) with Auto-Migration │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌──────────────────────────────┐     ┌────────────────────────┐
│     AI Provider Engine       │     │   Self-Contained DB    │
│  • Built-in Offline Engine   │     │   • Decks & Flashcards │
│  • Google Gemini 1.5 Flash   │     │   • Markdown Notes     │
│  • OpenAI GPT-4o Mini        │     │   • Focus Sessions     │
│  • Groq Llama 3.3 70B        │     │   • Practice Quizzes   │
│  • Ollama (Local Model)      │     │   • Study Milestones   │
└──────────────────────────────┘     └────────────────────────┘
```

---

## 🚀 Quick Start (Local Setup)

### Option 1: One-Click Launchers

- **Windows (Command Prompt / Explorer)**: Double-click or run:
  ```cmd
  run.bat
  ```
- **Windows (PowerShell)**:
  ```powershell
  .\run.ps1
  ```
- **Linux / macOS**:
  ```bash
  chmod +x run.sh
  ./run.sh
  ```

Open your browser and navigate to: **`http://localhost:8000`**

---

### Option 2: Manual Setup with `uv` or `pip`

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mahanadeltarably123-afk/Study-Buddy.git
   cd Study-Buddy
   ```

2. **Create virtual environment & install dependencies**:
   ```bash
   # Using uv (lightning fast)
   uv venv --python 3.12 .venv
   uv pip install -r requirements.txt

   # Or standard pip
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Start the application**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

---

## 🐳 Docker Deployment

Run with zero dependencies via Docker & Docker Compose:

```bash
# Build and start container
docker-compose up -d --build

# View container logs
docker-compose logs -f

# Stop container
docker-compose down
```

The database volume persists under `study-data` automatically.

---

## ☁️ Cloud Deployment Blueprints

### 1. Render.com (1-Click Deployment)
This repo includes a production `render.yaml` blueprint:
1. Connect your GitHub repository to [Render](https://render.com).
2. Click **New** $\rightarrow$ **Blueprint** $\rightarrow$ select this repository.
3. Render automatically provisions the service, persistent disk, and health checks.

### 2. Vercel
Configured via `vercel.json`:
```bash
npm install -g vercel
vercel
```

### 3. Railway.app
Configured via `railway.json`:
1. Push code to GitHub.
2. Create a new project on [Railway](https://railway.app) from GitHub repo.
3. Deployment is detected and started automatically.

---

## 📡 REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/health` | `GET` | Health check probe (Docker & uptime monitors) |
| `/api/decks` | `GET`, `POST` | List all flashcard decks / create new deck |
| `/api/decks/{id}/review` | `GET` | Retrieve cards currently due for spaced repetition review |
| `/api/cards` | `POST`, `DELETE` | Add card to deck / delete card |
| `/api/cards/review` | `POST` | Submit recall grade (0-3) to update SM-2 interval |
| `/api/cards/generate-ai` | `POST` | Auto-generate flashcards from any topic or text prompt |
| `/api/notes` | `GET`, `POST`, `PUT`, `DELETE` | CRUD for study notes |
| `/api/notes/summarize` | `POST` | Generate bullet-point, TL;DR, or Feynman summaries |
| `/api/tutor/chat` | `POST` | Multi-turn conversational chat with AI Study Tutor |
| `/api/tutor/personas` | `GET` | Available tutor personas & coaching styles |
| `/api/quizzes/generate` | `POST` | Create practice test questions with instant feedback |
| `/api/quizzes/{id}/submit`| `POST` | Grade quiz submission and get detailed explanations |
| `/api/pomodoro/log` | `POST` | Record completed focus session |
| `/api/stats/dashboard` | `GET` | Aggregated dashboard analytics |

---

## 🧪 Running Automated Tests

Run the full pytest suite with async test runner:

```bash
pytest -vv
```

---

## 📄 License
Released under the [MIT License](LICENSE).
