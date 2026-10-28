
# Study Buddy - RAG Backend

This directory contains the Python FastAPI backend for the Study Buddy application. It follows a strictly modular architecture to handle the RAG (Retrieval Augmented Generation) pipeline.

---

## 🤖 DIRECTIVES FOR AI AGENT (GitHub Copilot / Cursor)

**System Role:** You are a Senior Backend Architect.
**Objective:** Set up the backend using the exact directory structure defined below.

### 🛑 PHASE 1: CONFIGURATION

1.  **Python Version:** Ensure Python 3.10+ is installed.
2.  **Virtual Env:**
    ```bash
    python -m venv venv
    # Windows: venv\Scripts\activate
    # Mac/Linux: source venv/bin/activate
    ```
3.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Environment:** Create a `.env` file with `GOOGLE_API_KEY=your_key_here`.

---

### 📂 PHASE 2: PROJECT STRUCTURE

**Action:** You must create the directory structure EXACTLY as shown below.

```text
backend/
├── .env
├── server.py                 # Entry point (FastAPI App)
├── requirements.txt
├── data/
│   ├── raw_media/            # Uploaded audio/video files
│   ├── transcripts/          # Text files from Whisper
│   ├── chunks/               # JSON/Text chunks
│   ├── embeddings/           # ChromaDB persistence folder
│   └── metadata/             # Optional: Metadata storage
└── src/
    ├── __init__.py
    ├── transcription/
    │   ├── __init__.py
    │   └── transcribe.py     # Logic to transcribe audio -> text
    ├── chunking/
    │   ├── __init__.py
    │   └── chunk.py          # Logic to split text -> chunks
    ├── embedding/
    │   ├── __init__.py
    │   └── embed.py          # Logic to generate vector embeddings
    ├── vectordb/
    │   ├── __init__.py
    │   └── vectordb.py       # Logic to interact with ChromaDB
    ├── rag/
    │   ├── __init__.py
    │   └── query.py          # RAG Engine (RetrievalQA) logic
    └── utils/
        ├── __init__.py
        └── helpers.py        # File handling and cleanup utilities
```

---

### 💻 PHASE 3: IMPLEMENTATION DETAILS

#### 1. `server.py` (Root of backend)
*   **Role:** The main FastAPI application entry point.
*   **Imports:** Import modules from `src.transcription`, `src.rag`, etc.
*   **Endpoints:**
    *   `POST /ingest`: Upload file -> Save to `data/raw_media` -> Transcribe -> Chunk -> Embed -> Store in VectorDB.
    *   `POST /chat`: Receive user query -> RAG Engine Query -> Return response.
*   **CORS:** Enable CORS for `http://localhost:5173` (Frontend).

#### 2. `src/transcription/transcribe.py`
*   **Function:** `transcribe_audio(file_path)`
*   **Model:** Use OpenAI Whisper (base or small model) locally.

#### 3. `src/chunking/chunk.py`
*   **Function:** `chunk_text(text)`
*   **Logic:** Use LangChain's `RecursiveCharacterTextSplitter` (chunk_size=1000, chunk_overlap=200).

#### 4. `src/embedding/embed.py`
*   **Function:** `get_embedding_function()`
*   **Model:** Use `SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")`.

#### 5. `src/vectordb/vectordb.py`
*   **Class:** `VectorStore`
*   **Logic:** Initialize ChromaDB with persistence in `data/embeddings/`. Provide methods to `add_documents` and `as_retriever`.

#### 6. `src/rag/query.py`
*   **Class:** `RAGEngine`
*   **Logic:** Initialize `ChatGoogleGenerativeAI` (Gemini). Create a `RetrievalQA` chain using the retriever from `VectorStore`.

---

### 🚀 PHASE 4: RUNNING THE SERVER

**Command:**
```bash
# Make sure you are in the backend directory
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```
