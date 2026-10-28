import pytest
from app.services.spaced_repetition import calculate_sm2

def test_sm2_first_repetition_again():
    # Grade 0 (Again): should reset repetition count and schedule for immediate review
    rep, interval, ef, due = calculate_sm2(grade=0, repetition=2, interval=6, ease_factor=2.5)
    assert rep == 0
    assert interval == 0
    assert ef < 2.5  # ease factor penalized

def test_sm2_success_progression():
    # Grade 2 (Good) from fresh card
    rep, interval, ef, due = calculate_sm2(grade=2, repetition=0, interval=0, ease_factor=2.5)
    assert rep == 1
    assert interval == 1
    
    # Second success
    rep2, interval2, ef2, due2 = calculate_sm2(grade=2, repetition=rep, interval=interval, ease_factor=ef)
    assert rep2 == 2
    assert interval2 == 6

def test_sm2_easy_bonus():
    # Grade 3 (Easy) receives bonus
    rep, interval, ef, due = calculate_sm2(grade=3, repetition=2, interval=6, ease_factor=2.5)
    assert rep == 3
    assert interval > 6
    assert ef > 2.5  # ease factor increases
