import React from 'react';
import { UserStats, Workspace, SavedLecture, Todo, Note } from '../types';
import { AnalyticsView } from './AnalyticsView';
import { TodoListView } from './TodoListView';
import { NotesView } from './NotesView';
import { LayoutDashboard } from 'lucide-react';

interface StudentHubProps {
  stats: UserStats;
  lectures: SavedLecture[];
  workspaces: Workspace[];
  todos: Todo[];
  activeWorkspace?: Workspace;
  onUpdateWorkspace?: (id: string, updates: Partial<Workspace>) => void;
  onAddTodo: (data: Omit<Todo, 'id' | 'isCompleted' | 'createdAt'>) => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onUpdateTodo: (id: string, updates: Partial<Todo>) => void;
  generalNotes: Note[];
  onAddGeneralNote: (content: string) => void;
  onDeleteGeneralNote: (id: string) => void;
  t: any;
}

export const StudentHub: React.FC<StudentHubProps> = ({ 
  stats, lectures, workspaces, todos, activeWorkspace, onUpdateWorkspace, onAddTodo, onToggleTodo, onDeleteTodo, onUpdateTodo,
  generalNotes, onAddGeneralNote, onDeleteGeneralNote, t 
}) => {
  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-12">
      <div className="mb-8">
        <h2 className="font-heading text-3xl font-bold text-text flex items-center gap-3">
           <LayoutDashboard className="w-8 h-8 text-primary" /> Student Hub
        </h2>
        <p className="text-gray-500 mt-2">Your central dashboard for analytics, tasks, and notes.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: To-Do List & Notes */}
        <div className="xl:col-span-1 flex flex-col gap-8">
            <div className="h-full">
                <TodoListView 
                    todos={todos}
                    onAddTodo={onAddTodo}
                    onToggleTodo={onToggleTodo}
                    onDeleteTodo={onDeleteTodo}
                    onUpdateTodo={onUpdateTodo}
                    activeWorkspace={activeWorkspace}
                    onUpdateWorkspace={onUpdateWorkspace}
                    t={t}
                />
            </div>

            <div className="h-[500px] bg-surface border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col">
                <h3 className="font-bold text-xl mb-4 text-text">{t?.generalNotes || "General Notes"}</h3>
                <div className="flex-1 overflow-hidden relative">
                    <NotesView 
                        notes={generalNotes} 
                        onAddNote={onAddGeneralNote} 
                        onDeleteNote={onDeleteGeneralNote} 
                        t={t}
                    />
                </div>
            </div>
        </div>

        {/* Right Column: Analytics */}
        <div className="xl:col-span-2">
            <AnalyticsView 
                stats={stats}
                lectures={lectures}
                workspaces={workspaces}
                t={t}
            />
        </div>
      </div>
    </div>
  );
};