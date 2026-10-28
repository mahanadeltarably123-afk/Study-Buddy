import aiosqlite
from datetime import datetime, timezone, timedelta

async def seed_initial_data(db: aiosqlite.Connection):
    """Populates the database with initial decks, flashcards, notes, and goals if empty."""
    async with db.execute("SELECT COUNT(*) as count FROM decks;") as cursor:
        row = await cursor.fetchone()
        if row and row["count"] > 0:
            return  # Already seeded

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    due_today = now
    due_tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S")

    # 1. Seed Decks
    decks_data = [
        ("Python Mastery & Internals", "Core language features, generators, decorators, memory management, and async I/O.", "🐍", "emerald"),
        ("Algorithms & Data Structures", "Big-O notation, binary search, sorting, graphs, and dynamic programming.", "⚡", "indigo"),
        ("Web Architecture & APIs", "REST, HTTP/2 & 3, Docker containerization, microservices, and databases.", "🌐", "purple"),
        ("Cellular Biology & Genetics", "DNA transcription, cellular respiration, neurons, and synaptic transmission.", "🧬", "rose")
    ]

    for title, desc, icon, color in decks_data:
        cursor = await db.execute(
            "INSERT INTO decks (title, description, icon, color) VALUES (?, ?, ?, ?)",
            (title, desc, icon, color)
        )
        deck_id = cursor.lastrowid

        # Seed Cards per deck
        if "Python" in title:
            cards = [
                ("What is the difference between a List and a Tuple?", "Lists are mutable and take more memory; Tuples are immutable and hashable.", "Think about mutability"),
                ("What does the 'yield' keyword do in a function?", "It creates a generator, returning values one at a time and pausing execution state.", "Memory-efficient iteration"),
                ("What is the Global Interpreter Lock (GIL)?", "A mutex that prevents multiple native threads from executing Python bytecode simultaneously in CPython.", "Thread synchronization in CPython"),
                ("What is the time complexity of dictionary key lookup?", "Average O(1) via hash table indexing.", "Hash map property")
            ]
        elif "Algorithms" in title:
            cards = [
                ("What is the worst-case time complexity of QuickSort?", "O(n^2) when bad pivots are chosen (e.g. sorted array with first element pivot); average is O(n log n).", "Consider sorted array pivot"),
                ("What data structure is used to implement Breadth-First Search (BFS)?", "A Queue (FIFO: First-In, First-Out).", "Opposite of Stack for DFS"),
                ("What is the time complexity of searching in a balanced Binary Search Tree (AVL / Red-Black)?", "O(log n) time.", "Tree height is log n"),
                ("What is Dynamic Programming?", "An optimization technique that solves complex problems by breaking them down into simpler subproblems and memoizing results.", "Overlapping subproblems & optimal substructure")
            ]
        elif "Web Architecture" in title:
            cards = [
                ("What does HTTP status code 401 vs 403 signify?", "401 is Unauthorized (authentication needed / missing); 403 is Forbidden (authenticated but lacks permission).", "Auth vs Permission"),
                ("What is the difference between a Docker Image and a Container?", "An image is a read-only template/blueprint; a container is a runnable, isolated instance of that image.", "Class vs Object"),
                ("What are the 4 ACID properties of database transactions?", "Atomicity, Consistency, Isolation, Durability.", "Acronym for transaction safety"),
                ("What is the purpose of a reverse proxy like NGINX?", "To distribute incoming client requests across backend servers, handle SSL termination, caching, and rate limiting.", "Gateway between clients & web servers")
            ]
        else:
            cards = [
                ("What is the primary function of Mitochondria in eukaryotic cells?", "Synthesizing ATP (adenosine triphosphate) via cellular respiration.", "Powerhouse of the cell"),
                ("What is an Action Potential?", "A rapid, transient depolarization and repolarization of a neuron's membrane potential that transmits nerve signals.", "All-or-none electrical impulse"),
                ("What are the 4 nitrogenous bases of DNA?", "Adenine (A), Thymine (T), Cytosine (C), and Guanine (G).", "A pairs with T, C pairs with G"),
                ("What is the Central Dogma of Molecular Biology?", "Genetic information flows from DNA -> RNA (Transcription) -> Protein (Translation).", "DNA to Protein pathway")
            ]

        for front, back, hint in cards:
            await db.execute(
                """INSERT INTO cards (deck_id, front, back, hint, repetition, interval, ease_factor, due_date)
                   VALUES (?, ?, ?, ?, 0, 0, 2.5, ?)""",
                (deck_id, front, back, hint, due_today)
            )

    # 2. Seed Notes
    sample_notes = [
        (
            "Big-O Complexity & Data Structures Cheat Sheet",
            "# Big-O Complexity Guide\n\n- Array/List: Access O(1), Search O(n), Insertion/Deletion O(n)\n- Hash Table: Access N/A, Search O(1) avg, Insert O(1) avg\n- Binary Search Tree: Access/Search/Insert O(log n) avg, O(n) worst\n- Merge Sort: O(n log n) in all cases\n- Quick Sort: O(n log n) avg, O(n^2) worst\n\nAlways analyze space complexity alongside time complexity!",
            "Computer Science",
            "**TL;DR**: Hash tables give O(1) lookups; balanced trees give O(log n); MergeSort guarantees O(n log n) at the cost of O(n) extra space.",
            "algorithms,big-o,data-structures"
        ),
        (
            "High-Yield Distributed Systems & Microservices",
            "# Microservices Architecture Notes\n\n1. **Service Discovery**: Allows services to find each other dynamically (Consul, Eureka).\n2. **Circuit Breakers**: Prevent cascading failure across dependent network services.\n3. **Event-Driven Messaging**: Kafka / RabbitMQ decouple producers and consumers asynchronously.\n4. **Database-per-Service**: Essential to maintain domain isolation and prevent tight coupling.",
            "System Design",
            "**Key Takeaways**: Decouple state with event streams, isolate database boundaries per service, and protect cross-service calls with circuit breakers.",
            "system-design,architecture,backend"
        )
    ]

    for title, content, cat, summary, tags in sample_notes:
        await db.execute(
            """INSERT INTO notes (title, content, category, summary, tags)
               VALUES (?, ?, ?, ?, ?)""",
            (title, content, cat, summary, tags)
        )

    # 3. Seed Study Goals
    sample_goals = [
        ("Review 15 Spaced Repetition Flashcards", 1.0, 0.5, "Daily Goal", 0),
        ("Complete 4 Focused Pomodoro Sessions", 2.0, 1.0, "Daily Goal", 0),
        ("Master Big-O Graph Traversal Algorithms", 3.0, 1.5, "Weekly Milestone", 0)
    ]
    for title, target_h, cur_h, target_d, is_comp in sample_goals:
        await db.execute(
            "INSERT INTO study_goals (title, target_hours, current_hours, target_date, is_completed) VALUES (?, ?, ?, ?, ?)",
            (title, target_h, cur_h, target_d, is_comp)
        )

    await db.commit()
