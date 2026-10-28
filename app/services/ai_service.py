import json
import re
import httpx
from typing import List, Dict, Any, Optional
from app.config import settings

PERSONA_PROMPTS = {
    "Socratic Tutor": "You are a master Socratic tutor. Never just hand out the final answer directly; guide the student through probing questions, real-world analogies, and incremental hints that lead them to deduce the concept themselves.",
    "Feynman Explainer": "You teach using the Feynman Technique. Explain complex topics using plain, relatable language, everyday metaphors, and zero unnecessary jargon. If technical terms are used, define them with an intuitive analogy.",
    "Exam Coach": "You are a high-yield exam preparation coach. Emphasize key testable points, mnemonics, common exam pitfalls/traps, and rapid recall summaries.",
    "Code Specialist": "You are a senior computer science mentor and software engineer. Provide clear, idiomatic code examples with line-by-line explanations, time/space complexity analysis (Big-O), and edge cases."
}

class AIService:
    @staticmethod
    def _detect_topic_heuristics(text: str) -> Dict[str, Any]:
        """Offline heuristic knowledge retriever for common academic and technical concepts."""
        text_lower = text.lower()
        
        if any(w in text_lower for w in ["python", "list", "dict", "tuple", "async", "decorator", "generator"]):
            return {
                "topic": "Python Programming",
                "summary": "Python is a high-level, interpreted language emphasizing readability. Key concepts include dynamic typing, first-class functions, list comprehensions, and async/await event loops.",
                "feynman": "Think of Python like clear English instructions for a chef: instead of complicated syntax, it uses clean indentation so anyone can read the recipe.",
                "cards": [
                    {"front": "What is the difference between a List and a Tuple in Python?", "back": "Lists are mutable (can be changed in-place); Tuples are immutable and hashable."},
                    {"front": "What does the 'yield' keyword do in Python?", "back": "It turns a function into a generator, pausing execution and returning values on-demand to save memory."},
                    {"front": "What is the GIL (Global Interpreter Lock)?", "back": "A mutex that allows only one thread to execute Python bytecode at a time in CPython."},
                    {"front": "What is the time complexity of dictionary lookup in Python?", "back": "Average O(1) using hash table indexing."},
                ]
            }
        elif any(w in text_lower for w in ["algorithm", "big-o", "sort", "tree", "graph", "binary search", "recursion"]):
            return {
                "topic": "Data Structures & Algorithms",
                "summary": "Algorithms solve problems efficiently. Performance is measured by Big-O notation for time and space complexity under worst-case inputs.",
                "feynman": "Big-O is like planning a delivery route: sorting 10 packages by hand is fast, but sorting 10,000 needs an organized conveyor belt (MergeSort: O(N log N)) rather than checking every single pair (BubbleSort: O(N^2)).",
                "cards": [
                    {"front": "What is the time complexity of Binary Search?", "back": "O(log n) time, requiring a sorted collection."},
                    {"front": "What is the worst-case time complexity of QuickSort?", "back": "O(n^2) when the pivot chosen is consistently the smallest or largest element; average is O(n log n)."},
                    {"front": "What is the difference between BFS and DFS in graph traversal?", "back": "BFS explores level by level using a Queue; DFS explores as deep as possible first using a Stack/Recursion."},
                    {"front": "Why is a Hash Table lookup O(1) on average?", "back": "Because the hash function maps keys directly to bucket indices in array memory."}
                ]
            }
        elif any(w in text_lower for w in ["biology", "cell", "dna", "neuron", "mitochondria", "synapse", "brain"]):
            return {
                "topic": "Biology & Neuroscience",
                "summary": "Biological systems operate via cellular machinery, genetic encoding (DNA/RNA), and neural networks communicating via chemical and electrical signaling.",
                "feynman": "A cell is like a miniature walled factory: DNA is the blueprints in the central office (nucleus), ribosomes are workers building tools (proteins), and mitochondria are the power generators (ATP).",
                "cards": [
                    {"front": "What is the function of Mitochondria?", "back": "They generate most of the chemical energy needed to power the cell's biochemical reactions (ATP synthesis)."},
                    {"front": "What is an Action Potential in a neuron?", "back": "A rapid change in membrane voltage triggered by voltage-gated ion channels that propagates electrical signals down the axon."},
                    {"front": "What is Long-Term Potentiation (LTP)?", "back": "A persistent strengthening of synapses based on recent patterns of activity, fundamental to learning and memory formation."},
                    {"front": "What are the four nucleotide bases in DNA?", "back": "Adenine (A), Thymine (T), Cytosine (C), and Guanine (G)."}
                ]
            }
        elif any(w in text_lower for w in ["http", "rest", "api", "docker", "database", "sql", "backend"]):
            return {
                "topic": "Web Architecture & Systems",
                "summary": "Web systems connect clients and servers over HTTP/HTTPS using REST or RPC architectures, containerized with Docker, and backed by SQL/NoSQL databases.",
                "feynman": "An API is like a restaurant menu: you (the client) pick items from the menu, the waiter transmits your order to the kitchen (server), and returns your prepared meal without you needing to step inside the kitchen.",
                "cards": [
                    {"front": "What is the difference between GET and POST in HTTP?", "back": "GET requests retrieve data and should be idempotent; POST submits data to create/modify resources and may have side effects."},
                    {"front": "What does HTTP status code 404 vs 500 mean?", "back": "404 is Not Found (client error / resource missing); 500 is Internal Server Error (server crashed or encountered an unhandled exception)."},
                    {"front": "What is ACID in database systems?", "back": "Atomicity, Consistency, Isolation, Durability — properties ensuring reliable database transactions."},
                    {"front": "What is a Docker container?", "back": "A lightweight, standalone, executable package that bundles code and all its dependencies so applications run consistently across environments."}
                ]
            }
        else:
            return {
                "topic": "General Concept",
                "summary": f"Key principles and core concepts regarding '{text[:40]}...'. Active recall and spaced repetition accelerate long-term retention.",
                "feynman": f"To master this: break it down into core components, remove unnecessary jargon, and explain each step as if teaching a beginner.",
                "cards": [
                    {"front": f"What is the foundational definition of {text[:30]}?", "back": f"The core mechanism that defines {text[:30]} in its domain."},
                    {"front": f"Why is understanding {text[:30]} important?", "back": "It provides foundational leverage for solving higher-order problems in this topic."},
                    {"front": "What common mistake should you avoid when applying this?", "back": "Assuming surface familiarity equals deep conceptual mastery; test yourself with practice questions!"}
                ]
            }

    @classmethod
    async def ask_tutor(
        cls,
        message: str,
        persona: str = "Socratic Tutor",
        history: Optional[List[Dict[str, str]]] = None,
        context: Optional[str] = "",
        api_provider: Optional[str] = None
    ) -> Dict[str, str]:
        """Provides AI Tutor response across Gemini, OpenAI, Groq, Ollama, or Heuristic fallback."""
        provider = (api_provider or settings.DEFAULT_AI_PROVIDER).lower()
        system_prompt = PERSONA_PROMPTS.get(persona, PERSONA_PROMPTS["Socratic Tutor"])
        if context:
            system_prompt += f"\n\nStudent Study Context / Relevant Notes:\n{context}"

        # 1. Google Gemini API
        if (provider == "gemini" or (provider == "heuristic" and settings.GEMINI_API_KEY)) and settings.GEMINI_API_KEY:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
                payload = {
                    "contents": [
                        {"role": "user", "parts": [{"text": f"{system_prompt}\n\nStudent: {message}"}]}
                    ]
                }
                async with httpx.AsyncClient(timeout=20.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        reply = data["candidates"][0]["content"]["parts"][0]["text"]
                        return {"reply": reply, "persona": persona, "provider_used": "Gemini 1.5 Flash"}
            except Exception as e:
                pass  # Fallback to heuristic

        # 2. OpenAI / Groq API (OpenAI-compatible)
        target_key = settings.OPENAI_API_KEY if provider == "openai" else settings.GROQ_API_KEY
        target_url = "https://api.openai.com/v1/chat/completions" if provider == "openai" else "https://api.groq.com/openai/v1/chat/completions"
        target_model = "gpt-4o-mini" if provider == "openai" else "llama-3.3-70b-versatile"

        if target_key:
            try:
                messages = [{"role": "system", "content": system_prompt}]
                if history:
                    messages.extend(history[-6:])
                messages.append({"role": "user", "content": message})
                async with httpx.AsyncClient(timeout=20.0) as client:
                    resp = await client.post(
                        target_url,
                        headers={"Authorization": f"Bearer {target_key}"},
                        json={"model": target_model, "messages": messages, "temperature": 0.7}
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        reply = data["choices"][0]["message"]["content"]
                        return {"reply": reply, "persona": persona, "provider_used": f"{provider.capitalize()} ({target_model})"}
            except Exception as e:
                pass

        # 3. Built-in Smart Heuristic Offline Engine
        heuristics = cls._detect_topic_heuristics(message)
        
        if persona == "Socratic Tutor":
            reply = (
                f"💡 **Socratic Guidance on {heuristics['topic']}**\n\n"
                f"You asked: *\"{message}\"*\n\n"
                f"Let's break this down from first principles:\n"
                f"1. **Observation**: What happens when we analyze this scenario under baseline conditions?\n"
                f"2. **Key Question**: If you had to explain the main difference or constraint here, what would be the single most crucial factor?\n"
                f"3. **Next Step**: Consider {heuristics['feynman']}\n\n"
                f"👉 *How would you apply this principle to your specific problem? Give it a shot, and I'll evaluate your reasoning!*"
            )
        elif persona == "Feynman Explainer":
            reply = (
                f"🧠 **Feynman Intuition: {heuristics['topic']}**\n\n"
                f"{heuristics['feynman']}\n\n"
                f"### Core Concept in Plain Words:\n"
                f"{heuristics['summary']}\n\n"
                f"🎯 **Rule of Thumb**: If you can't explain it to an 8-year-old without technical jargon, you don't truly understand it yet. Try explaining it back to me in your own words!"
            )
        elif persona == "Exam Coach":
            reply = (
                f"🎯 **High-Yield Exam Strategy: {heuristics['topic']}**\n\n"
                f"**Top Testable Takeaways:**\n"
                f"- High-Frequency Concept: `{heuristics['topic']}` is tested in over 80% of standard technical exams.\n"
                f"- Common Pitfall: Confusing operational mechanics with conceptual definitions.\n"
                f"- Quick Mnemonic / Rule:\n"
                f"  > **{heuristics['summary']}**\n\n"
                f"⚡ **Active Recall Drill**: Try to answer this: *\"{heuristics['cards'][0]['front']}\"* (Answer: ||{heuristics['cards'][0]['back']}||)"
            )
        else:  # Code Specialist
            reply = (
                f"💻 **Code & Architecture Breakdown: {heuristics['topic']}**\n\n"
                f"### Concept Overview:\n"
                f"{heuristics['summary']}\n\n"
                f"### Best Practice Reference:\n"
                f"```python\n# Clean, idiomatic demonstration\ndef demonstrate_concept(items):\n    # Optimized approach: O(1) lookup or generator pipeline\n    return [item for item in items if item is not None]\n```\n\n"
                f"**Complexity Analysis:**\n"
                f"- Time Complexity: `O(N)` linear traversal\n"
                f"- Space Complexity: `O(N)` allocated buffer"
            )

        return {"reply": reply, "persona": persona, "provider_used": "Built-in Heuristic Engine (Offline Mode)"}

    @classmethod
    async def summarize_text(cls, content: str, style: str = "bullet_points") -> str:
        """Generates structured summaries for notes."""
        heuristics = cls._detect_topic_heuristics(content)
        
        if style == "tldr":
            return f"**TL;DR**: {heuristics['summary']}"
        elif style == "feynman":
            return f"**Feynman Breakdown**:\n{heuristics['feynman']}\n\n**Key Takeaway**: {heuristics['summary']}"
        elif style == "mindmap":
            return (
                f"```mermaid\nmindmap\n  root(( {heuristics['topic']} ))\n"
                f"    Core Principles\n      Foundations\n      Mechanics\n"
                f"    Applications\n      Real-world Use\n      Optimization\n"
                f"    Key Rules\n      Best Practices\n      Edge Cases\n```"
            )
        else:  # bullet_points
            lines = [line.strip() for line in content.split("\n") if line.strip()]
            preview = lines[:3] if lines else [heuristics['summary']]
            bullets = "\n".join(f"- 📌 {line}" for line in preview)
            return (
                f"### 📋 Key Summary Points ({heuristics['topic']})\n"
                f"{bullets}\n"
                f"- 💡 **Core Insight**: {heuristics['summary']}\n"
                f"- 🚀 **Actionable Takeaway**: {heuristics['feynman']}"
            )

    @classmethod
    async def generate_flashcards(cls, topic_or_content: str, count: int = 4) -> List[Dict[str, str]]:
        """Generates flashcards from study notes or topic prompts."""
        heuristics = cls._detect_topic_heuristics(topic_or_content)
        cards = heuristics.get("cards", [])
        
        # Ensure we return at least `count` cards
        while len(cards) < count:
            idx = len(cards) + 1
            cards.append({
                "front": f"Key Principle #{idx} regarding '{topic_or_content[:25]}...'",
                "back": f"Essential operational detail #{idx}: Active recall reinforces synaptic pathways."
            })
            
        return cards[:count]

    @classmethod
    async def generate_quiz(cls, topic_or_content: str, num_questions: int = 4, difficulty: str = "medium") -> List[Dict[str, Any]]:
        """Generates interactive multiple-choice quiz questions."""
        heuristics = cls._detect_topic_heuristics(topic_or_content)
        cards = heuristics.get("cards", [])
        
        quiz = []
        for i, card in enumerate(cards[:num_questions]):
            correct_ans = card["back"]
            distractor_1 = "It is completely deprecated and discouraged in modern standards."
            distractor_2 = "It requires manual assembly pointers and lacks safety guarantees."
            distractor_3 = "It executes strictly in O(N^3) time complexity."
            
            options = [correct_ans, distractor_1, distractor_2, distractor_3]
            # Place correct answer deterministically or rotate
            correct_idx = i % 4
            if correct_idx != 0:
                options[0], options[correct_idx] = options[correct_idx], options[0]
                
            quiz.append({
                "id": i + 1,
                "question": card["front"],
                "options": options,
                "correct_index": correct_idx,
                "explanation": f"Correct: {correct_ans} (Difficulty: {difficulty.capitalize()})"
            })
            
        return quiz
