
import React, { useState } from 'react';
import { Note } from '../types';
import { Plus, Trash2, FileText } from 'lucide-react';

interface NotesViewProps {
  notes: Note[];
  onAddNote: (content: string) => void;
  onDeleteNote: (id: string) => void;
  t?: any; // Added translation prop
}

export const NotesView: React.FC<NotesViewProps> = ({ notes, onAddNote, onDeleteNote, t }) => {
  const [currentNote, setCurrentNote] = useState('');

  const handleAddClick = () => {
    if (!currentNote.trim()) return;
    onAddNote(currentNote);
    setCurrentNote('');
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      <div className="mb-6 flex gap-3">
        <div className="flex-1 relative">
            <textarea
            value={currentNote}
            onChange={(e) => setCurrentNote(e.target.value)}
            placeholder={t?.notePlaceholder || "Type your study notes here..."}
            className="w-full bg-surface border border-gray-200 dark:border-gray-700 rounded-xl p-4 pr-12 text-text focus:outline-none focus:border-primary resize-none h-28 shadow-inner transition-colors"
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-500">
                {t?.markdownSupported || "Markdown Supported"}
            </div>
        </div>
        <button
          onClick={handleAddClick}
          className="bg-primary hover:bg-blue-600 text-white rounded-xl px-6 flex flex-col items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/20"
        >
          <Plus className="w-6 h-6" />
          <span className="font-semibold">{t?.addNote || "Add Note"}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {notes.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500 border-2 border-dashed border-gray-300 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-transparent">
                <FileText className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-center px-4">{t?.noNotesYet || "No notes yet. Save interesting answers from the Chat or type above!"}</p>
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
