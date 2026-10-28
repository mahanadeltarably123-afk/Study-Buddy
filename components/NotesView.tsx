import React, { useState } from 'react';
import { Note } from '../types';
import { Plus, Trash2, FileText, Sparkles, Brain, ListChecks, Wand2, Loader2 } from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface NotesViewProps {
  notes: Note[];
  onAddNote: (content: string) => void;
  onDeleteNote: (id: string) => void;
  t?: any;
}

export const NotesView: React.FC<NotesViewProps> = ({ notes, onAddNote, onDeleteNote, t }) => {
  const [currentNote, setCurrentNote] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryMode, setSummaryMode] = useState<'tldr' | 'feynman' | 'key_points'>('tldr');

  const handleAddClick = () => {
    if (!currentNote.trim()) return;
    onAddNote(currentNote);
    setCurrentNote('');
  };

  const handleAISummarize = async (mode: 'tldr' | 'feynman' | 'key_points') => {
    if (!currentNote.trim() || isSummarizing) return;
    setIsSummarizing(true);
    setSummaryMode(mode);

    try {
      // First attempt backend /api/notes/summarize
      let summaryResult = '';
      try {
        const res = await fetch('/api/notes/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: currentNote, mode })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.summary) summaryResult = data.summary;
        }
      } catch (e) {
        // Fallback to client Gemini service
      }

      if (!summaryResult) {
        const prompt = mode === 'tldr' 
          ? `Provide a concise 2-sentence executive TL;DR summary of this note:\n\n${currentNote}`
          : mode === 'feynman'
          ? `Break down this note using the Feynman Technique (plain language, intuitive metaphors, zero jargon):\n\n${currentNote}`
          : `Extract the high-yield bullet point concepts and mnemonics from this note:\n\n${currentNote}`;
        summaryResult = await geminiService.chatWithContext("Note Summarizer", [], prompt);
      }

      onAddNote(`**AI Summary (${mode.toUpperCase()}):**\n\n${summaryResult}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      <div className="mb-6 flex flex-col gap-3">
        <div className="relative">
          <textarea
            value={currentNote}
            onChange={(e) => setCurrentNote(e.target.value)}
            placeholder={t?.notePlaceholder || "Type or paste your lecture / study notes here..."}
            className="w-full bg-surface border border-gray-200 dark:border-gray-700 rounded-xl p-4 pr-12 text-text focus:outline-none focus:border-primary resize-none h-32 shadow-inner transition-colors"
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-400">
            {t?.markdownSupported || "Markdown Supported"}
          </div>
        </div>

        {/* Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> AI Smart Tools:
            </span>
            <button
              onClick={() => handleAISummarize('tldr')}
              disabled={isSummarizing || !currentNote.trim()}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:text-primary transition-all disabled:opacity-40 flex items-center gap-1.5"
            >
              <Wand2 className="w-3 h-3" /> TL;DR
            </button>
            <button
              onClick={() => handleAISummarize('feynman')}
              disabled={isSummarizing || !currentNote.trim()}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:text-primary transition-all disabled:opacity-40 flex items-center gap-1.5"
            >
              <Brain className="w-3 h-3" /> Feynman
            </button>
            <button
              onClick={() => handleAISummarize('key_points')}
              disabled={isSummarizing || !currentNote.trim()}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:text-primary transition-all disabled:opacity-40 flex items-center gap-1.5"
            >
              <ListChecks className="w-3 h-3" /> Key Points
            </button>
          </div>

          <button
            onClick={handleAddClick}
            disabled={!currentNote.trim()}
            className="bg-primary hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl px-6 py-2.5 flex items-center gap-2 transition-colors shadow-lg shadow-blue-900/20 font-semibold text-sm"
          >
            {isSummarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>{t?.addNote || "Add Note"}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {notes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-44 text-gray-500 border-2 border-dashed border-gray-300 dark:border-gray-800 rounded-xl bg-surface">
            <FileText className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-center px-4 font-medium">{t?.noNotesYet || "No notes yet. Save interesting answers from the Chat or type above!"}</p>
            <span className="text-xs text-gray-400 mt-1">Use the AI Smart Tools to auto-summarize key concepts.</span>
          </div>
        )}
        {notes.map((note) => (
          <div key={note.id} className="bg-surface border border-gray-200 dark:border-gray-700 rounded-xl p-5 group relative animate-fade-in hover:border-primary/30 transition-all shadow-sm">
            <div className="prose prose-sm max-w-none text-text dark:prose-invert whitespace-pre-wrap">
              {note.content}
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs font-mono text-gray-500">{new Date(note.timestamp).toLocaleString()}</span>
              <button
                onClick={() => onDeleteNote(note.id)}
                className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                title="Delete Note"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
