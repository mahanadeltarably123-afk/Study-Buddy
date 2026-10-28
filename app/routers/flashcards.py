from fastapi import APIRouter, Depends, HTTPException
import aiosqlite
from typing import List
from datetime import datetime, timezone
from app.database import get_db
from app.models import (
    DeckCreate, DeckResponse, CardCreate, CardResponse, 
    CardReviewGrade, GenerateCardsRequest
)
from app.services.spaced_repetition import calculate_sm2
from app.services.ai_service import AIService

router = APIRouter(prefix="/api/decks", tags=["Flashcards & Decks"])

@router.get("", response_model=List[DeckResponse])
async def list_decks(db: aiosqlite.Connection = Depends(get_db)):
    """List all decks with card count and due card counts."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    query = """
    SELECT 
        d.id, d.title, d.description, d.icon, d.color, d.created_at,
        COUNT(c.id) as card_count,
        SUM(CASE WHEN c.due_date <= ? THEN 1 ELSE 0 END) as due_count
    FROM decks d
    LEFT JOIN cards c ON d.id = c.deck_id
    GROUP BY d.id
    ORDER BY d.created_at DESC;
    """
    async with db.execute(query, (now,)) as cursor:
        rows = await cursor.fetchall()
        return [
            DeckResponse(
                id=row["id"],
                title=row["title"],
                description=row["description"],
                icon=row["icon"],
                color=row["color"],
                created_at=row["created_at"],
                card_count=row["card_count"] or 0,
                due_count=row["due_count"] or 0
            ) for row in rows
        ]

@router.post("", response_model=DeckResponse)
async def create_deck(deck: DeckCreate, db: aiosqlite.Connection = Depends(get_db)):
    """Create a new flashcard deck."""
    cursor = await db.execute(
        "INSERT INTO decks (title, description, icon, color) VALUES (?, ?, ?, ?)",
        (deck.title, deck.description, deck.icon, deck.color)
    )
    await db.commit()
    deck_id = cursor.lastrowid
    
    async with db.execute("SELECT * FROM decks WHERE id = ?", (deck_id,)) as cursor:
        row = await cursor.fetchone()
        return DeckResponse(
            id=row["id"],
            title=row["title"],
            description=row["description"],
            icon=row["icon"],
            color=row["color"],
            created_at=row["created_at"],
            card_count=0,
            due_count=0
        )

@router.get("/{deck_id}/cards", response_model=List[CardResponse])
async def get_deck_cards(deck_id: int, db: aiosqlite.Connection = Depends(get_db)):
    """Get all cards in a specific deck."""
    async with db.execute("SELECT * FROM cards WHERE deck_id = ? ORDER BY id DESC", (deck_id,)) as cursor:
        rows = await cursor.fetchall()
        return [
            CardResponse(
                id=r["id"],
                deck_id=r["deck_id"],
                front=r["front"],
                back=r["back"],
                hint=r["hint"] or "",
                repetition=r["repetition"],
                interval=r["interval"],
                ease_factor=r["ease_factor"],
                due_date=r["due_date"],
                created_at=r["created_at"]
            ) for r in rows
        ]

@router.get("/{deck_id}/review", response_model=List[CardResponse])
async def get_cards_due_for_review(deck_id: int, db: aiosqlite.Connection = Depends(get_db)):
    """Get all cards in a deck due for spaced repetition review."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    query = "SELECT * FROM cards WHERE deck_id = ? AND due_date <= ? ORDER BY due_date ASC;"
    async with db.execute(query, (deck_id, now)) as cursor:
        rows = await cursor.fetchall()
        return [
            CardResponse(
                id=r["id"],
                deck_id=r["deck_id"],
                front=r["front"],
                back=r["back"],
                hint=r["hint"] or "",
                repetition=r["repetition"],
                interval=r["interval"],
                ease_factor=r["ease_factor"],
                due_date=r["due_date"],
                created_at=r["created_at"]
            ) for r in rows
        ]

@router.delete("/{deck_id}")
async def delete_deck(deck_id: int, db: aiosqlite.Connection = Depends(get_db)):
    """Delete a deck and all its associated cards."""
    await db.execute("DELETE FROM decks WHERE id = ?", (deck_id,))
    await db.commit()
    return {"message": "Deck deleted successfully"}

# ================= Direct Card Endpoints =================
cards_router = APIRouter(prefix="/api/cards", tags=["Cards"])

@cards_router.post("", response_model=CardResponse)
async def create_card(card: CardCreate, db: aiosqlite.Connection = Depends(get_db)):
    """Add a card to a deck."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    cursor = await db.execute(
        """INSERT INTO cards (deck_id, front, back, hint, repetition, interval, ease_factor, due_date)
           VALUES (?, ?, ?, ?, 0, 0, 2.5, ?)""",
        (card.deck_id, card.front, card.back, card.hint, now)
    )
    await db.commit()
    card_id = cursor.lastrowid
    
    async with db.execute("SELECT * FROM cards WHERE id = ?", (card_id,)) as cursor:
        row = await cursor.fetchone()
        return CardResponse(
            id=row["id"],
            deck_id=row["deck_id"],
            front=row["front"],
            back=row["back"],
            hint=row["hint"] or "",
            repetition=row["repetition"],
            interval=row["interval"],
            ease_factor=row["ease_factor"],
            due_date=row["due_date"],
            created_at=row["created_at"]
        )

@cards_router.post("/review")
async def review_card(review: CardReviewGrade, db: aiosqlite.Connection = Depends(get_db)):
    """
    Submits a review grade for a flashcard and updates its SuperMemo-2 spaced repetition status.
    grade: 0=Again, 1=Hard, 2=Good, 3=Easy
    """
    async with db.execute("SELECT * FROM cards WHERE id = ?", (review.card_id,)) as cursor:
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Card not found")
        
        rep = row["repetition"]
        interval = row["interval"]
        ef = row["ease_factor"]
        
    new_rep, new_interval, new_ef, next_due = calculate_sm2(
        grade=review.grade,
        repetition=rep,
        interval=interval,
        ease_factor=ef
    )
    
    await db.execute(
        """UPDATE cards 
           SET repetition = ?, interval = ?, ease_factor = ?, due_date = ?
           WHERE id = ?""",
        (new_rep, new_interval, new_ef, next_due, review.card_id)
    )
    await db.commit()
    
    return {
        "card_id": review.card_id,
        "grade": review.grade,
        "repetition": new_rep,
        "interval_days": new_interval,
        "ease_factor": new_ef,
        "next_due_date": next_due
    }

@cards_router.delete("/{card_id}")
async def delete_card(card_id: int, db: aiosqlite.Connection = Depends(get_db)):
    """Delete a card."""
    await db.execute("DELETE FROM cards WHERE id = ?", (card_id,))
    await db.commit()
    return {"message": "Card deleted successfully"}

@cards_router.post("/generate-ai")
async def generate_cards_with_ai(req: GenerateCardsRequest, db: aiosqlite.Connection = Depends(get_db)):
    """Automatically generates flashcards using AI service and saves them directly to deck."""
    generated = await AIService.generate_flashcards(req.topic_or_content, count=req.count or 5)
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    
    saved_cards = []
    for item in generated:
        cursor = await db.execute(
            """INSERT INTO cards (deck_id, front, back, hint, repetition, interval, ease_factor, due_date)
               VALUES (?, ?, ?, '', 0, 0, 2.5, ?)""",
            (req.deck_id, item["front"], item["back"], now)
        )
        saved_cards.append({
            "id": cursor.lastrowid,
            "deck_id": req.deck_id,
            "front": item["front"],
            "back": item["back"]
        })
    await db.commit()
    return {"created_count": len(saved_cards), "cards": saved_cards}
