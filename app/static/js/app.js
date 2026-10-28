/**
 * Study Buddy - Core SPA Application Logic
 */

const API_BASE = "";
const AppState = {
  currentView: "dashboard",
  decks: [],
  activeDeck: null,
  reviewQueue: [],
  currentCardIndex: 0,
  isCardFlipped: false,
  notes: [],
  activeNote: null,
  tutorSessionId: "session_" + Math.random().toString(36).substring(2, 9),
  tutorPersona: "Socratic Tutor",
  quizzes: [],
  activeQuiz: null,
  activeQuizAnswers: {},
  pomodoro: {
    mode: "work", // "work", "short_break", "long_break"
    workDuration: 25 * 60,
    shortBreakDuration: 5 * 60,
    longBreakDuration: 15 * 60,
    timeLeft: 25 * 60,
    isRunning: false,
    intervalId: null,
    subject: "General Study"
  }
};

// ================= Utility Functions =================
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  const bg = type === "error" ? "bg-rose-600" : type === "success" ? "bg-emerald-600" : "bg-indigo-600";
  toast.className = `${bg} text-white px-4 py-2.5 rounded-lg shadow-xl text-sm font-medium flex items-center space-x-2 transition-all transform duration-300 opacity-0 translate-y-2`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.remove("opacity-0", "translate-y-2");
  }, 10);
  
  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function playCompletionChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch (e) {
    console.log("Audio alert not supported or user hasn't interacted yet");
  }
}

// Simple safe markdown renderer
function renderMarkdown(text) {
  if (!text) return "";
  let html = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-indigo-300 mt-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-white mt-2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-white mt-2">$1</h1>')
    .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc text-slate-300">$1</li>')
    .replace(/\n\n/g, '<p class="my-2"></p>')
    .replace(/\n/g, '<br/>');
  return html;
}

// ================= Navigation =================
function switchView(viewName) {
  AppState.currentView = viewName;
  document.querySelectorAll(".view-panel").forEach(el => el.classList.add("hidden"));
  const target = document.getElementById(`view-${viewName}`);
  if (target) target.classList.remove("hidden");

  // Update nav buttons
  document.querySelectorAll(".nav-btn").forEach(btn => {
    if (btn.dataset.view === viewName) {
      btn.classList.add("bg-indigo-600", "text-white");
      btn.classList.remove("text-slate-400", "hover:bg-slate-800");
    } else {
      btn.classList.remove("bg-indigo-600", "text-white");
      btn.classList.add("text-slate-400", "hover:bg-slate-800");
    }
  });

  // Load view-specific data
  if (viewName === "dashboard") loadDashboard();
  if (viewName === "decks") loadDecks();
  if (viewName === "notes") loadNotes();
  if (viewName === "quizzes") loadQuizzes();
  if (viewName === "settings") loadSettings();
}

// ================= Dashboard =================
async function loadDashboard() {
  try {
    const res = await fetch(`${API_BASE}/api/stats/dashboard`);
    const data = await res.json();
    document.getElementById("stat-decks").innerText = data.total_decks;
    document.getElementById("stat-cards-due").innerText = data.due_cards;
    document.getElementById("stat-notes").innerText = data.total_notes;
    document.getElementById("stat-focus-time").innerText = `${data.focus_hours_today} hrs`;
    document.getElementById("stat-quizzes").innerText = `${data.avg_quiz_score}%`;
    loadGoals();
  } catch (err) {
    console.error("Failed to load dashboard stats", err);
  }
}

async function loadGoals() {
  try {
    const res = await fetch(`${API_BASE}/api/goals`);
    const goals = await res.json();
    const container = document.getElementById("dashboard-goals-list");
    if (!container) return;
    if (goals.length === 0) {
      container.innerHTML = `<div class="text-slate-400 text-sm italic">No goals added yet. Add one to track milestones!</div>`;
      return;
    }
    container.innerHTML = goals.map(g => `
      <div class="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
        <div class="flex items-center space-x-3">
          <input type="checkbox" ${g.is_completed ? "checked" : ""} onchange="toggleGoal(${g.id})" class="w-5 h-5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer">
          <span class="${g.is_completed ? "line-through text-slate-500" : "text-slate-200 font-medium"} text-sm">${g.title}</span>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-xs px-2.5 py-1 rounded-full bg-slate-700/50 text-indigo-300 font-semibold">${g.target_date || "Milestone"}</span>
          <button onclick="deleteGoal(${g.id})" class="text-slate-500 hover:text-rose-400 p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        </div>
      </div>
    `).join("");
    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error("Failed to load goals", err);
  }
}

async function toggleGoal(goalId) {
  await fetch(`${API_BASE}/api/goals/${goalId}/toggle`, { method: "PUT" });
  loadGoals();
}

async function deleteGoal(goalId) {
  await fetch(`${API_BASE}/api/goals/${goalId}`, { method: "DELETE" });
  loadGoals();
  showToast("Goal removed");
}

async function createNewGoalPrompt() {
  const title = prompt("Enter study goal or milestone:");
  if (!title) return;
  await fetch(`${API_BASE}/api/goals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, target_hours: 2.0, target_date: "Today" })
  });
  loadGoals();
  showToast("Goal added!", "success");
}

// ================= Flashcards & Active Recall =================
async function loadDecks() {
  try {
    const res = await fetch(`${API_BASE}/api/decks`);
    AppState.decks = await res.json();
    const container = document.getElementById("decks-container");
    if (!container) return;

    if (AppState.decks.length === 0) {
      container.innerHTML = `<div class="col-span-full text-center py-12 text-slate-400">No decks found. Click "Create Deck" or generate one with AI!</div>`;
      return;
    }

    container.innerHTML = AppState.decks.map(d => `
      <div class="glass-panel p-6 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
        <div>
          <div class="flex items-center justify-between mb-4">
            <span class="text-3xl p-3 bg-slate-800/80 rounded-2xl border border-slate-700">${d.icon}</span>
            <div class="flex items-center space-x-2">
              ${d.due_count > 0 
                ? `<span class="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-bold animate-pulse">${d.due_count} due</span>`
                : `<span class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold">Caught up</span>`
              }
            </div>
          </div>
          <h3 class="text-xl font-bold text-white mb-2">${d.title}</h3>
          <p class="text-slate-400 text-sm line-clamp-2 mb-4">${d.description || "Active recall flashcard collection."}</p>
        </div>
        <div class="pt-4 border-t border-slate-800 flex items-center justify-between">
          <span class="text-xs text-slate-400 font-medium">${d.card_count} total cards</span>
          <div class="flex items-center space-x-2">
            <button onclick="openDeckReview(${d.id})" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg transition">
              Review (${d.due_count})
            </button>
            <button onclick="openAiGenerateModal(${d.id})" title="Auto-Generate Cards with AI" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700">
              <i data-lucide="sparkles" class="w-4 h-4"></i>
            </button>
            <button onclick="openAddCardModal(${d.id})" title="Add Card" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700">
              <i data-lucide="plus" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
    `).join("");
    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error("Failed to load decks", err);
  }
}

async function openDeckReview(deckId) {
  try {
    const res = await fetch(`${API_BASE}/api/decks/${deckId}/review`);
    let cards = await res.json();
    if (cards.length === 0) {
      // If none due, fetch all cards for practice
      const allRes = await fetch(`${API_BASE}/api/decks/${deckId}/cards`);
      cards = await allRes.json();
      if (cards.length === 0) {
        showToast("This deck has no cards yet. Add some first!", "error");
        return;
      }
      showToast("No cards strictly due today — launching practice mode!", "info");
    }

    AppState.activeDeck = AppState.decks.find(d => d.id === deckId);
    AppState.reviewQueue = cards;
    AppState.currentCardIndex = 0;
    AppState.isCardFlipped = false;
    switchView("review");
    renderCurrentReviewCard();
  } catch (err) {
    console.error("Failed to open review", err);
  }
}

function renderCurrentReviewCard() {
  const container = document.getElementById("review-card-area");
  if (!container) return;

  if (AppState.currentCardIndex >= AppState.reviewQueue.length) {
    // Review complete!
    playCompletionChime();
    container.innerHTML = `
      <div class="glass-panel p-10 rounded-3xl text-center max-w-lg mx-auto">
        <div class="text-6xl mb-4">🎉</div>
        <h2 class="text-2xl font-bold text-white mb-2">Review Complete!</h2>
        <p class="text-slate-400 mb-6">You've successfully tested your active recall for this session. Spaced repetition due dates have been scheduled.</p>
        <button onclick="switchView('decks')" class="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg">
          Back to Decks
        </button>
      </div>
    `;
    return;
  }

  const card = AppState.reviewQueue[AppState.currentCardIndex];
  const total = AppState.reviewQueue.length;
  const current = AppState.currentCardIndex + 1;
  AppState.isCardFlipped = false;

  container.innerHTML = `
    <div class="max-w-2xl mx-auto">
      <div class="flex items-center justify-between mb-4 text-xs font-semibold text-slate-400">
        <span>Deck: ${AppState.activeDeck ? AppState.activeDeck.title : "Practice"}</span>
        <span>Card ${current} of ${total}</span>
      </div>
      
      <div class="w-full bg-slate-800 rounded-full h-1.5 mb-6 overflow-hidden">
        <div class="bg-indigo-500 h-1.5 rounded-full transition-all duration-300" style="width: ${(current / total) * 100}%"></div>
      </div>

      <!-- Flip Card Container -->
      <div onclick="flipReviewCard()" class="perspective-1000 cursor-pointer mb-6 select-none">
        <div id="flashcard-inner" class="relative w-full min-h-[300px] rounded-3xl glass-panel p-8 flex flex-col justify-between border border-slate-700/60 shadow-2xl transition-transform duration-500 transform-style-preserve-3d">
          <div class="flex items-center justify-between text-xs text-indigo-400 font-bold uppercase tracking-wider">
            <span id="card-side-label">Front (Question)</span>
            <span class="text-slate-500">Click or press Space to flip ↺</span>
          </div>
          <div id="card-content-text" class="text-xl md:text-2xl font-semibold text-white my-auto text-center leading-relaxed">
            ${renderMarkdown(card.front)}
          </div>
          <div id="card-hint-text" class="text-xs text-slate-400 text-center italic">
            ${card.hint ? `Hint: ${card.hint}` : ""}
          </div>
        </div>
      </div>

      <!-- Rating Controls (Hidden until flipped) -->
      <div id="review-rating-controls" class="hidden grid grid-cols-4 gap-3">
        <button onclick="gradeCurrentCard(0)" class="p-3 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-bold text-sm transition">
          <div class="text-xs text-rose-400 font-normal">1 - Again</div>
          10 min
        </button>
        <button onclick="gradeCurrentCard(1)" class="p-3 rounded-2xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-bold text-sm transition">
          <div class="text-xs text-amber-400 font-normal">2 - Hard</div>
          1 day
        </button>
        <button onclick="gradeCurrentCard(2)" class="p-3 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold text-sm transition">
          <div class="text-xs text-indigo-400 font-normal">3 - Good</div>
          3-6 days
        </button>
        <button onclick="gradeCurrentCard(3)" class="p-3 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-sm transition">
          <div class="text-xs text-emerald-400 font-normal">4 - Easy</div>
          7+ days
        </button>
      </div>
    </div>
  `;
}

function flipReviewCard() {
  const card = AppState.reviewQueue[AppState.currentCardIndex];
  if (!card) return;
  AppState.isCardFlipped = !AppState.isCardFlipped;
  
  const inner = document.getElementById("flashcard-inner");
  const sideLabel = document.getElementById("card-side-label");
  const content = document.getElementById("card-content-text");
  const ratingControls = document.getElementById("review-rating-controls");

  if (AppState.isCardFlipped) {
    if (sideLabel) sideLabel.innerText = "Back (Answer)";
    if (content) content.innerHTML = renderMarkdown(card.back);
    if (ratingControls) ratingControls.classList.remove("hidden");
    if (inner) inner.classList.add("border-indigo-500/40");
  } else {
    if (sideLabel) sideLabel.innerText = "Front (Question)";
    if (content) content.innerHTML = renderMarkdown(card.front);
    if (ratingControls) ratingControls.classList.add("hidden");
    if (inner) inner.classList.remove("border-indigo-500/40");
  }
}

async function gradeCurrentCard(grade) {
  const card = AppState.reviewQueue[AppState.currentCardIndex];
  if (!card) return;

  try {
    await fetch(`${API_BASE}/api/cards/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ card_id: card.id, grade: grade })
    });
  } catch (err) {
    console.error("Failed to grade card", err);
  }

  AppState.currentCardIndex++;
  renderCurrentReviewCard();
}

// Global keyboard shortcuts for review mode
window.addEventListener("keydown", (e) => {
  if (AppState.currentView === "review") {
    if (e.code === "Space") {
      e.preventDefault();
      flipReviewCard();
    } else if (AppState.isCardFlipped) {
      if (e.key === "1") gradeCurrentCard(0);
      if (e.key === "2") gradeCurrentCard(1);
      if (e.key === "3") gradeCurrentCard(2);
      if (e.key === "4") gradeCurrentCard(3);
    }
  }
});

// Modals: Add Deck, Add Card, AI Generate
function openCreateDeckModal() {
  const title = prompt("Deck Title (e.g. Machine Learning Basics):");
  if (!title) return;
  const desc = prompt("Deck Description:") || "";
  const icon = prompt("Deck Emoji Icon (e.g. 🤖):") || "📚";
  fetch(`${API_BASE}/api/decks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description: desc, icon })
  }).then(() => {
    loadDecks();
    showToast("Deck created!", "success");
  });
}

function openAddCardModal(deckId) {
  const front = prompt("Card Question / Front side:");
  if (!front) return;
  const back = prompt("Card Answer / Back side:");
  if (!back) return;
  const hint = prompt("Optional Hint:") || "";
  fetch(`${API_BASE}/api/cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deck_id: deckId, front, back, hint })
  }).then(() => {
    loadDecks();
    showToast("Card added!", "success");
  });
}

async function openAiGenerateModal(deckId) {
  const topic = prompt("Enter topic, concept, or paste text to generate flashcards for:");
  if (!topic) return;
  showToast("Generating AI flashcards...", "info");
  try {
    const res = await fetch(`${API_BASE}/api/cards/generate-ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deck_id: deckId, topic_or_content: topic, count: 4 })
    });
    const data = await res.json();
    loadDecks();
    showToast(`Created ${data.created_count} flashcards with AI!`, "success");
  } catch (err) {
    showToast("Failed to generate flashcards", "error");
  }
}

// ================= Smart Notes =================
async function loadNotes() {
  try {
    const res = await fetch(`${API_BASE}/api/notes`);
    AppState.notes = await res.json();
    const listEl = document.getElementById("notes-list");
    if (!listEl) return;

    if (AppState.notes.length === 0) {
      listEl.innerHTML = `<div class="p-6 text-slate-400 text-sm text-center">No notes yet. Click "+ New Note" to begin!</div>`;
      return;
    }

    listEl.innerHTML = AppState.notes.map(n => `
      <div onclick="selectNote(${n.id})" class="p-4 rounded-xl cursor-pointer border border-slate-800 transition ${AppState.activeNote && AppState.activeNote.id === n.id ? "bg-indigo-600/20 border-indigo-500/50" : "hover:bg-slate-800/60"}">
        <h4 class="font-bold text-white text-sm mb-1">${n.title}</h4>
        <p class="text-xs text-slate-400 line-clamp-2">${n.content.substring(0, 90)}</p>
        <div class="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/50 text-[10px] text-slate-500">
          <span>${n.category || "General"}</span>
          <span>${n.updated_at.split(" ")[0]}</span>
        </div>
      </div>
    `).join("");

    if (!AppState.activeNote && AppState.notes.length > 0) {
      selectNote(AppState.notes[0].id);
    }
  } catch (err) {
    console.error("Failed to load notes", err);
  }
}

function selectNote(noteId) {
  const note = AppState.notes.find(n => n.id === noteId);
  if (!note) return;
  AppState.activeNote = note;
  
  const titleEl = document.getElementById("note-title-input");
  const contentEl = document.getElementById("note-content-input");
  const summaryArea = document.getElementById("note-summary-display");

  if (titleEl) titleEl.value = note.title;
  if (contentEl) contentEl.value = note.content;
  if (summaryArea) {
    if (note.summary) {
      summaryArea.innerHTML = renderMarkdown(note.summary);
      summaryArea.classList.remove("hidden");
    } else {
      summaryArea.classList.add("hidden");
    }
  }
  loadNotes(); // refresh highlight
}

async function createNewNote() {
  const res = await fetch(`${API_BASE}/api/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Untitled Study Note", content: "# Key Takeaways\n\nStart jotting down concepts here...", category: "General" })
  });
  const newNote = await res.json();
  await loadNotes();
  selectNote(newNote.id);
  showToast("New note created", "success");
}

async function saveActiveNote() {
  if (!AppState.activeNote) return;
  const title = document.getElementById("note-title-input").value;
  const content = document.getElementById("note-content-input").value;

  await fetch(`${API_BASE}/api/notes/${AppState.activeNote.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content })
  });
  showToast("Note saved!", "success");
  loadNotes();
}

async function summarizeActiveNote(style = "bullet_points") {
  if (!AppState.activeNote) return;
  showToast("Generating AI Summary...", "info");
  try {
    const res = await fetch(`${API_BASE}/api/notes/summarize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note_id: AppState.activeNote.id, style })
    });
    const data = await res.json();
    const summaryArea = document.getElementById("note-summary-display");
    if (summaryArea) {
      summaryArea.innerHTML = renderMarkdown(data.summary);
      summaryArea.classList.remove("hidden");
    }
    showToast("Summary generated!", "success");
  } catch (err) {
    showToast("Failed to summarize note", "error");
  }
}

async function deleteActiveNote() {
  if (!AppState.activeNote) return;
  if (!confirm("Delete this note?")) return;
  await fetch(`${API_BASE}/api/notes/${AppState.activeNote.id}`, { method: "DELETE" });
  AppState.activeNote = null;
  loadNotes();
  showToast("Note deleted");
}

// ================= AI Tutor Chat =================
async function sendTutorMessage(promptText = null) {
  const input = document.getElementById("tutor-user-input");
  const message = promptText || (input ? input.value.trim() : "");
  if (!message) return;

  if (input && !promptText) input.value = "";

  const chatContainer = document.getElementById("tutor-messages");
  if (chatContainer) {
    // Append User Message
    const userDiv = document.createElement("div");
    userDiv.className = "flex justify-end mb-4";
    userDiv.innerHTML = `
      <div class="bg-indigo-600 text-white px-5 py-3 rounded-2xl rounded-tr-none max-w-xl text-sm shadow-md">
        ${message}
      </div>
    `;
    chatContainer.appendChild(userDiv);

    // Append Typing Indicator
    const typingDiv = document.createElement("div");
    typingDiv.id = "tutor-typing-indicator";
    typingDiv.className = "flex justify-start mb-4";
    typingDiv.innerHTML = `
      <div class="glass-panel px-5 py-3 rounded-2xl rounded-tl-none text-slate-400 text-sm flex items-center space-x-2">
        <span class="animate-pulse">Thinking...</span>
      </div>
    `;
    chatContainer.appendChild(typingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  try {
    const personaSelect = document.getElementById("tutor-persona-select");
    const persona = personaSelect ? personaSelect.value : AppState.tutorPersona;
    
    // Check if there is an active note to provide as context
    const noteContext = AppState.activeNote ? `Active Note Title: ${AppState.activeNote.title}\nContent:\n${AppState.activeNote.content}` : "";

    const res = await fetch(`${API_BASE}/api/tutor/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: AppState.tutorSessionId,
        persona: persona,
        message: message,
        context: noteContext
      })
    });
    const data = await res.json();

    const indicator = document.getElementById("tutor-typing-indicator");
    if (indicator) indicator.remove();

    if (chatContainer) {
      const tutorDiv = document.createElement("div");
      tutorDiv.className = "flex justify-start mb-4";
      tutorDiv.innerHTML = `
        <div class="glass-panel px-6 py-4 rounded-2xl rounded-tl-none max-w-2xl text-slate-200 text-sm shadow-xl markdown-body border border-slate-700/60">
          <div class="flex items-center justify-between text-xs text-indigo-400 font-bold mb-2 pb-2 border-b border-slate-800">
            <span>${data.persona}</span>
            <span class="text-slate-500 font-normal text-[11px]">${data.provider_used}</span>
          </div>
          <div>${renderMarkdown(data.reply)}</div>
        </div>
      `;
      chatContainer.appendChild(tutorDiv);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  } catch (err) {
    const indicator = document.getElementById("tutor-typing-indicator");
    if (indicator) indicator.remove();
    showToast("Error connecting to tutor", "error");
  }
}

async function clearTutorHistory() {
  await fetch(`${API_BASE}/api/tutor/history/${AppState.tutorSessionId}`, { method: "DELETE" });
  const chatContainer = document.getElementById("tutor-messages");
  if (chatContainer) {
    chatContainer.innerHTML = `
      <div class="text-center py-8 text-slate-400 text-sm">
        <p class="font-semibold text-white">Chat history cleared.</p>
        <p>Ask a question or select a topic to begin!</p>
      </div>
    `;
  }
  showToast("Chat cleared");
}

// ================= Pomodoro Focus Timer =================
function setPomodoroMode(mode) {
  AppState.pomodoro.mode = mode;
  clearInterval(AppState.pomodoro.intervalId);
  AppState.pomodoro.isRunning = false;

  document.querySelectorAll(".pomodoro-tab").forEach(tab => {
    if (tab.dataset.mode === mode) {
      tab.classList.add("bg-indigo-600", "text-white");
      tab.classList.remove("text-slate-400");
    } else {
      tab.classList.remove("bg-indigo-600", "text-white");
      tab.classList.add("text-slate-400");
    }
  });

  if (mode === "work") AppState.pomodoro.timeLeft = AppState.pomodoro.workDuration;
  if (mode === "short_break") AppState.pomodoro.timeLeft = AppState.pomodoro.shortBreakDuration;
  if (mode === "long_break") AppState.pomodoro.timeLeft = AppState.pomodoro.longBreakDuration;

  updatePomodoroDisplay();
  const playBtn = document.getElementById("pomodoro-play-btn");
  if (playBtn) playBtn.innerHTML = `<i data-lucide="play" class="w-6 h-6"></i>`;
  if (window.lucide) lucide.createIcons();
}

function updatePomodoroDisplay() {
  const mins = Math.floor(AppState.pomodoro.timeLeft / 60);
  const secs = AppState.pomodoro.timeLeft % 60;
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  
  const display = document.getElementById("pomodoro-timer-display");
  if (display) display.innerText = timeStr;
  document.title = `${timeStr} - Study Buddy`;
}

function togglePomodoroTimer() {
  const p = AppState.pomodoro;
  const playBtn = document.getElementById("pomodoro-play-btn");
  const ring = document.getElementById("pomodoro-ring");

  if (p.isRunning) {
    clearInterval(p.intervalId);
    p.isRunning = false;
    if (playBtn) playBtn.innerHTML = `<i data-lucide="play" class="w-6 h-6"></i>`;
    if (ring) ring.classList.remove("timer-active");
  } else {
    p.isRunning = true;
    if (playBtn) playBtn.innerHTML = `<i data-lucide="pause" class="w-6 h-6"></i>`;
    if (ring) ring.classList.add("timer-active");

    p.intervalId = setInterval(async () => {
      p.timeLeft--;
      updatePomodoroDisplay();

      if (p.timeLeft <= 0) {
        clearInterval(p.intervalId);
        p.isRunning = false;
        if (ring) ring.classList.remove("timer-active");
        playCompletionChime();

        // Log session to backend
        const duration = p.mode === "work" ? 25 : p.mode === "short_break" ? 5 : 15;
        await fetch(`${API_BASE}/api/pomodoro/log`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            duration_minutes: duration,
            mode: p.mode,
            subject: p.subject
          })
        });

        showToast(`${p.mode === "work" ? "Focus session completed! Great job!" : "Break finished! Ready to focus?"}`, "success");
        setPomodoroMode(p.mode === "work" ? "short_break" : "work");
      }
    }, 1000);
  }
  if (window.lucide) lucide.createIcons();
}

function resetPomodoroTimer() {
  setPomodoroMode(AppState.pomodoro.mode);
}

// ================= Quizzes & Practice Tests =================
async function loadQuizzes() {
  try {
    const res = await fetch(`${API_BASE}/api/quizzes`);
    AppState.quizzes = await res.json();
    const container = document.getElementById("quizzes-list-container");
    if (!container) return;

    if (AppState.quizzes.length === 0) {
      container.innerHTML = `<div class="p-8 text-center text-slate-400">No quizzes generated yet. Click "Generate Quiz" to test yourself!</div>`;
      return;
    }

    container.innerHTML = AppState.quizzes.map(q => `
      <div class="glass-panel p-5 rounded-2xl flex items-center justify-between">
        <div>
          <h4 class="font-bold text-white mb-1">${q.title}</h4>
          <p class="text-xs text-slate-400">Topic: ${q.topic} • ${q.total_questions} questions</p>
        </div>
        <div class="flex items-center space-x-3">
          <span class="text-xs px-3 py-1 rounded-full font-bold ${q.score > 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-700 text-slate-400"}">
            Score: ${q.score}/${q.total_questions}
          </span>
          <button onclick="startQuiz(${q.id})" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold">
            Take Quiz
          </button>
        </div>
      </div>
    `).join("");
  } catch (err) {
    console.error("Failed to load quizzes", err);
  }
}

async function generateQuizPrompt() {
  const topic = prompt("Enter topic or subject for quiz (e.g. Python Async, Big-O, Cellular Biology):");
  if (!topic) return;
  showToast("Generating test questions...", "info");
  try {
    const res = await fetch(`${API_BASE}/api/quizzes/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic_or_content: topic, num_questions: 4 })
    });
    const quizData = await res.json();
    showToast("Quiz generated!", "success");
    startQuiz(quizData.quiz_id);
  } catch (err) {
    showToast("Failed to generate quiz", "error");
  }
}

async function startQuiz(quizId) {
  try {
    const res = await fetch(`${API_BASE}/api/quizzes/${quizId}`);
    AppState.activeQuiz = await res.json();
    AppState.activeQuizAnswers = {};

    const container = document.getElementById("active-quiz-container");
    if (!container) return;

    container.innerHTML = `
      <div class="glass-panel p-8 rounded-3xl max-w-2xl mx-auto">
        <div class="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div>
            <h3 class="text-xl font-bold text-white">${AppState.activeQuiz.title}</h3>
            <p class="text-xs text-slate-400">${AppState.activeQuiz.total_questions} questions</p>
          </div>
          <button onclick="switchView('quizzes')" class="text-xs text-slate-400 hover:text-white">Close</button>
        </div>

        <form id="quiz-form" onsubmit="submitActiveQuiz(event)">
          ${AppState.activeQuiz.questions.map((q, idx) => `
            <div class="mb-6 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <h4 class="font-semibold text-white text-sm mb-3">${idx + 1}. ${q.question}</h4>
              <div class="space-y-2">
                ${q.options.map((opt, optIdx) => `
                  <label class="flex items-center space-x-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-indigo-500/50 transition">
                    <input type="radio" name="q_${q.id}" value="${optIdx}" required class="text-indigo-600 focus:ring-indigo-500">
                    <span class="text-sm text-slate-300">${opt}</span>
                  </label>
                `).join("")}
              </div>
            </div>
          `).join("")}

          <button type="submit" class="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg transition">
            Submit Test
          </button>
        </form>
      </div>
    `;
    document.getElementById("quizzes-list-view").classList.add("hidden");
    container.classList.remove("hidden");
  } catch (err) {
    showToast("Failed to load quiz", "error");
  }
}

async function submitActiveQuiz(e) {
  e.preventDefault();
  const form = e.target;
  const answers = {};

  AppState.activeQuiz.questions.forEach(q => {
    const selected = form.querySelector(`input[name="q_${q.id}"]:checked`);
    if (selected) answers[q.id] = parseInt(selected.value);
  });

  const res = await fetch(`${API_BASE}/api/quizzes/${AppState.activeQuiz.id}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers })
  });
  const result = await res.json();
  playCompletionChime();

  const container = document.getElementById("active-quiz-container");
  container.innerHTML = `
    <div class="glass-panel p-8 rounded-3xl max-w-2xl mx-auto text-center">
      <div class="text-5xl mb-3">${result.percentage >= 70 ? "🎯" : "📚"}</div>
      <h3 class="text-2xl font-bold text-white mb-1">Your Score: ${result.score} / ${result.total_questions}</h3>
      <p class="text-indigo-400 font-bold mb-6">${result.percentage}% Mastery</p>

      <div class="text-left space-y-4 mb-8">
        ${result.feedback.map((f, i) => `
          <div class="p-4 rounded-xl ${f.is_correct ? "bg-emerald-950/30 border border-emerald-500/30" : "bg-rose-950/30 border border-rose-500/30"}">
            <div class="font-semibold text-sm ${f.is_correct ? "text-emerald-300" : "text-rose-300"} mb-1">
              ${f.is_correct ? "✓ Correct" : "✗ Needs Review"}: ${f.question}
            </div>
            <p class="text-xs text-slate-300 mt-1">${f.explanation}</p>
          </div>
        `).join("")}
      </div>

      <button onclick="document.getElementById('active-quiz-container').classList.add('hidden'); document.getElementById('quizzes-list-view').classList.remove('hidden'); loadQuizzes();" class="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">
        Done
      </button>
    </div>
  `;
}

// ================= Settings =================
async function loadSettings() {
  try {
    const res = await fetch(`${API_BASE}/api/settings`);
    const data = await res.json();
    const providerSelect = document.getElementById("settings-provider-select");
    if (providerSelect) providerSelect.value = data.default_ai_provider;

    const geminiInput = document.getElementById("settings-gemini-key");
    if (geminiInput && data.has_gemini_key) geminiInput.placeholder = "•••••••••••••••• (Configured)";

    const openaiInput = document.getElementById("settings-openai-key");
    if (openaiInput && data.has_openai_key) openaiInput.placeholder = "•••••••••••••••• (Configured)";

    const groqInput = document.getElementById("settings-groq-key");
    if (groqInput && data.has_groq_key) groqInput.placeholder = "•••••••••••••••• (Configured)";
  } catch (err) {
    console.error("Failed to load settings", err);
  }
}

async function saveSettings() {
  const provider = document.getElementById("settings-provider-select").value;
  const gemini = document.getElementById("settings-gemini-key").value.trim();
  const openai = document.getElementById("settings-openai-key").value.trim();
  const groq = document.getElementById("settings-groq-key").value.trim();

  const payload = { ai_provider: provider };
  if (gemini) payload.gemini_api_key = gemini;
  if (openai) payload.openai_api_key = openai;
  if (groq) payload.groq_api_key = groq;

  await fetch(`${API_BASE}/api/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  showToast("Settings updated successfully!", "success");
}

// Initial Boot
document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) lucide.createIcons();
  loadDashboard();
});
