import pytest
from app.services.ai_service import AIService

@pytest.mark.asyncio
async def test_offline_heuristic_tutor():
    res = await AIService.ask_tutor(
        message="Explain binary search and time complexity",
        persona="Socratic Tutor"
    )
    assert "reply" in res
    assert "Socratic" in res["persona"]
    assert "Heuristic Engine" in res["provider_used"]
    assert len(res["reply"]) > 20

@pytest.mark.asyncio
async def test_summarize_styles():
    tldr = await AIService.summarize_text("Python list and tuple differences", style="tldr")
    assert "TL;DR" in tldr
    
    feynman = await AIService.summarize_text("Data structures and algorithms", style="feynman")
    assert "Feynman" in feynman

@pytest.mark.asyncio
async def test_generate_flashcards():
    cards = await AIService.generate_flashcards("Cellular biology and mitochondria", count=3)
    assert len(cards) >= 3
    assert "front" in cards[0]
    assert "back" in cards[0]

@pytest.mark.asyncio
async def test_generate_quiz():
    quiz = await AIService.generate_quiz("Web architecture and APIs", num_questions=4)
    assert len(quiz) == 4
    for q in quiz:
        assert len(q["options"]) == 4
        assert 0 <= q["correct_index"] <= 3
