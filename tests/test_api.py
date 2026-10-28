import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import init_db

@pytest.fixture(autouse=True)
async def setup_database():
    await init_db()

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Study Buddy" in data["app"]

@pytest.mark.asyncio
async def test_decks_and_cards():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create deck
        create_res = await ac.post("/api/decks", json={
            "title": "Test Deck",
            "description": "Integration test deck",
            "icon": "🧪"
        })
        assert create_res.status_code == 200
        deck_id = create_res.json()["id"]

        # Add card
        card_res = await ac.post("/api/cards", json={
            "deck_id": deck_id,
            "front": "What is 2+2?",
            "back": "4"
        })
        assert card_res.status_code == 200
        card_id = card_res.json()["id"]

        # Grade card
        review_res = await ac.post("/api/cards/review", json={
            "card_id": card_id,
            "grade": 2
        })
        assert review_res.status_code == 200
        assert review_res.json()["repetition"] == 1

@pytest.mark.asyncio
async def test_notes_crud():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create note
        res = await ac.post("/api/notes", json={
            "title": "Test Note",
            "content": "This is a test note for unit tests.",
            "category": "Testing"
        })
        assert res.status_code == 200
        note_id = res.json()["id"]

        # Summarize note
        sum_res = await ac.post("/api/notes/summarize", json={
            "note_id": note_id,
            "style": "bullet_points"
        })
        assert sum_res.status_code == 200
        assert "summary" in sum_res.json()

@pytest.mark.asyncio
async def test_tutor_personas():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/tutor/personas")
        assert res.status_code == 200
        personas = res.json()
        assert len(personas) >= 4
