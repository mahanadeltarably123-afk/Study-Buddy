from datetime import datetime, timezone, timedelta

def calculate_sm2(grade: int, repetition: int, interval: int, ease_factor: float):
    """
    SuperMemo-2 (SM-2) algorithm for active recall spaced repetition.
    
    grade:
        0 = Again (Complete blackout / incorrect)
        1 = Hard (Correct response after hesitation)
        2 = Good (Correct response with reasonable effort)
        3 = Easy (Perfect instant recall)
        
    Returns:
        tuple (new_repetition, new_interval_days, new_ease_factor, next_due_datetime)
    """
    # 1. Update Ease Factor (EF)
    # Standard SM-2 formula mapping 0-3 grade scale
    # EF' = EF + (0.1 - (3 - grade) * (0.08 + (3 - grade) * 0.02))
    diff = 3 - grade
    new_ef = ease_factor + (0.1 - diff * (0.08 + diff * 0.02))
    new_ef = max(1.3, round(new_ef, 2))
    
    # 2. Determine Repetition count and Interval
    if grade < 2:  # Fail or hard fail (Again / Hard)
        new_repetition = 0
        new_interval = 1 if grade == 1 else 0  # 0 = review same day
    else:  # Successful recall (Good / Easy)
        if repetition == 0:
            new_interval = 1
        elif repetition == 1:
            new_interval = 6
        else:
            new_interval = max(1, round(interval * new_ef))
        new_repetition = repetition + 1
        
        # Bonus for "Easy" rating
        if grade == 3 and repetition >= 1:
            new_interval = round(new_interval * 1.3)

    # 3. Calculate next due date
    now = datetime.now(timezone.utc)
    if new_interval == 0:
        # Due in 10 minutes for immediate re-learning
        next_due = now + timedelta(minutes=10)
    else:
        next_due = now + timedelta(days=new_interval)
        
    return new_repetition, new_interval, new_ef, next_due.strftime("%Y-%m-%d %H:%M:%S")
