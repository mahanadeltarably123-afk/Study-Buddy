import React, { useState, useEffect } from 'react';
import { Todo, Workspace } from '../types';
import { Plus, Trash2, Check, Circle, Timer, Flag, AlertCircle, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TodoListViewProps {
  todos: Todo[];
  onAddTodo: (data: Omit<Todo, 'id' | 'isCompleted' | 'createdAt'>) => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onUpdateTodo: (id: string, updates: Partial<Todo>) => void;
  activeWorkspace?: Workspace;
  onUpdateWorkspace?: (id: string, updates: Partial<Workspace>) => void;
  t?: any;
}

const IMPORTANCE_MAP: { [key in Todo['importance']]: { label: string; color: string; textColor: string; borderColor: string; } } = {
  low: { label: 'Low', color: 'bg-blue-500', textColor: 'text-blue-500', borderColor: 'border-blue-500' },
  medium: { label: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-500', borderColor: 'border-yellow-500' },
  high: { label: 'High', color: 'bg-red-500', textColor: 'text-red-500', borderColor: 'border-red-500' },
};

const Countdown = ({ deadline, now, large = false }: { deadline: number, now: number, large?: boolean }) => {
    const remaining = deadline - now;

    if (remaining <= 0) {
        return <span className={`flex items-center gap-1 font-bold text-red-500 ${large ? 'text-lg' : 'text-xs'}`}><AlertCircle size={large ? 20 : 14} /> Time's up!</span>;
    }

    const seconds = Math.floor((remaining / 1000) % 60);
    const minutes = Math.floor((remaining / (1000 * 60)) % 60);
    
    if (large) {
        const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
        const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
        return (
            <div className="flex items-end gap-2 sm:gap-4 font-mono text-primary">
                {days > 0 && <div className="text-center leading-none"><span className="text-2xl sm:text-4xl font-bold">{days}</span><span className="text-xs ml-1">d</span></div>}
                <div className="text-center leading-none"><span className="text-2xl sm:text-4xl font-bold">{hours.toString().padStart(2, '0')}</span><span className="text-xs ml-1">h</span></div>
                <div className="text-center leading-none"><span className="text-2xl sm:text-4xl font-bold">{minutes.toString().padStart(2, '0')}</span><span className="text-xs ml-1">m</span></div>
                <div className="text-center leading-none"><span className="text-2xl sm:text-4xl font-bold">{seconds.toString().padStart(2, '0')}</span><span className="text-xs ml-1">s</span></div>
            </div>
        );
    }

    // Individual task timer logic
    const hours = Math.floor(remaining / (1000 * 60 * 60));

    return (
        <div className="flex items-center gap-1 text-xs font-mono text-gray-400">
            <Timer size={14} />
            {hours > 0 && <span>{hours}h</span>}
            <span>{minutes.toString().padStart(2, '0')}m</span>
            <span>{seconds.toString().padStart(2, '0')}s</span>
        </div>
    );
};

export const TodoListView: React.FC<TodoListViewProps> = ({ todos, onAddTodo, onToggleTodo, onDeleteTodo, onUpdateTodo, t, activeWorkspace, onUpdateWorkspace }) => {
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoImportance, setNewTodoImportance] = useState<Todo['importance']>('medium');
  const [newTodoDuration, setNewTodoDuration] = useState('');
  const [mainDeadlineInput, setMainDeadlineInput] = useState('');
  const [mainDeadlineLabel, setMainDeadlineLabel] = useState(activeWorkspace?.mainDeadlineLabel || 'Main Deadline');
  const [isEditingLabel, setIsEditingLabel] = useState(false);

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
      if (activeWorkspace?.mainDeadline) {
          const d = new Date(activeWorkspace.mainDeadline);
          const formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          setMainDeadlineInput(formatted);
      } else {
          setMainDeadlineInput('');
      }
      setMainDeadlineLabel(activeWorkspace?.mainDeadlineLabel || 'Main Deadline');
  }, [activeWorkspace]);

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodoText.trim()) {
      onAddTodo({
        text: newTodoText,
        importance: newTodoImportance,
        repeat: 'none',
        deadline: newTodoDuration ? Date.now() + Number(newTodoDuration) * 60 * 1000 : undefined,
      });
      setNewTodoText('');
      setNewTodoImportance('medium');
      setNewTodoDuration('');
    }
  };

  const handleSetMainDeadline = () => {
      if (activeWorkspace && onUpdateWorkspace) {
          const deadline = mainDeadlineInput ? new Date(mainDeadlineInput).getTime() : undefined;
          onUpdateWorkspace(activeWorkspace.id, { mainDeadline: deadline });
      }
  };
  
  const handleSetMainDeadlineLabel = () => {
      if (activeWorkspace && onUpdateWorkspace && mainDeadlineLabel.trim()) {
          onUpdateWorkspace(activeWorkspace.id, { mainDeadlineLabel: mainDeadlineLabel });
      } else {
          setMainDeadlineLabel(activeWorkspace?.mainDeadlineLabel || 'Main Deadline');
      }
      setIsEditingLabel(false);
  };

  return (
    <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm h-full flex flex-col">
      <h3 className="font-bold text-xl mb-4 text-text">To-Do List</h3>
      
      {activeWorkspace && onUpdateWorkspace && (
          <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800/50 rounded-xl animate-fade-in border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-bold text-text uppercase tracking-wider mb-2 flex items-center gap-2 group">
                {isEditingLabel ? (
                    <input 
                        value={mainDeadlineLabel}
                        onChange={(e) => setMainDeadlineLabel(e.target.value)}
                        onBlur={handleSetMainDeadlineLabel}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSetMainDeadlineLabel() }}
                        className="bg-transparent outline-none border-b-2 border-primary p-0 text-sm font-bold uppercase tracking-wider"
                        autoFocus
                    />
                ) : (
                    <span className="cursor-pointer" onClick={() => setIsEditingLabel(true)}>{activeWorkspace?.mainDeadlineLabel || 'Main Deadline'}</span>
                )}
                <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setIsEditingLabel(true)} />
              </h4>
              {activeWorkspace.mainDeadline && activeWorkspace.mainDeadline > now ? (
                  <Countdown deadline={activeWorkspace.mainDeadline} now={now} large />
              ) : (
                  <p className="text-gray-500 text-sm italic">No main deadline set for this workspace.</p>
              )}
              <div className="flex gap-2 mt-3 items-center">
                  <input 
                      type="datetime-local"
                      value={mainDeadlineInput}
                      onChange={e => setMainDeadlineInput(e.target.value)}
                      className="w-full bg-background border border-gray-300 dark:border-gray-700 rounded-lg py-1 px-2 text-xs text-gray-500 focus:outline-none focus:border-primary"
                  />
                  <button onClick={handleSetMainDeadline} className="px-3 py-1.5 text-xs font-bold bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors">Set</button>
              </div>
          </div>
      )}

      <form onSubmit={handleAddTodo} className="space-y-3 mb-4">
        <div className="flex gap-2">
            <input
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 bg-background border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary"
            />
            <button
            type="submit"
            className="bg-primary text-white p-2.5 rounded-xl hover:bg-blue-600 transition-colors"
            >
            <Plus className="w-5 h-5" />
            </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
             <div className="space-y-2">
                 <label className="text-xs font-medium text-gray-400">Priority</label>
                 <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as const).map(level => (
                        <button type="button" key={level} onClick={() => setNewTodoImportance(level)} className={`w-6 h-6 rounded-full border-2 transition-transform ${newTodoImportance === level ? 'scale-110 ring-2 ring-offset-2 ring-primary ring-offset-surface' : 'hover:scale-110'} ${IMPORTANCE_MAP[level].color}`} title={`Importance: ${level}`}></button>
                    ))}
                 </div>
             </div>
             <div className="space-y-2">
                 <label className="text-xs font-medium text-gray-400">Duration (min)</label>
                 <input 
                     type="number"
                     value={newTodoDuration}
                     onChange={e => setNewTodoDuration(e.target.value)}
                     placeholder="e.g., 25"
                     className="w-full bg-background border border-gray-300 dark:border-gray-700 rounded-lg py-1 px-2 text-xs text-gray-500 focus:outline-none focus:border-primary"
                 />
             </div>
        </div>
      </form>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-2 custom-scrollbar min-h-[200px]">
        <AnimatePresence>
          {todos.map(todo => {
            const isOverdue = todo.deadline ? todo.deadline - now <= 0 : false;
            return (
                <motion.div
                key={todo.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                className={`group flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 ${todo.isCompleted ? 'border-green-500' : isOverdue ? 'border-red-500' : IMPORTANCE_MAP[todo.importance].borderColor}`}
                >
                <button onClick={() => onToggleTodo(todo.id)} className="flex-shrink-0 mt-0.5">
                    {todo.isCompleted ? <Check className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-gray-400" />}
                </button>
                <div className="flex-1 min-w-0">
                    <span className={`text-sm break-words ${todo.isCompleted ? 'line-through text-gray-500' : 'text-text'}`}>
                    {todo.text}
                    </span>
                    <div className="flex items-center gap-4 mt-2 text-gray-500">
                        {/* Priority Changer */}
                        <button
                        onClick={() => {
                            const priorities: Todo['importance'][] = ['low', 'medium', 'high'];
                            const currentIndex = priorities.indexOf(todo.importance);
                            const nextIndex = (currentIndex + 1) % priorities.length;
                            onUpdateTodo(todo.id, { importance: priorities[nextIndex] });
                        }}
                        title={`Priority: ${IMPORTANCE_MAP[todo.importance].label}. Click to change.`}
                        className={`flex items-center gap-1.5 hover:opacity-75 transition-opacity ${IMPORTANCE_MAP[todo.importance].textColor}`}
                        >
                        <Flag size={14} />
                        <span className="text-xs font-medium">{IMPORTANCE_MAP[todo.importance].label}</span>
                        </button>
                        
                        {/* Countdown Timer */}
                        {todo.deadline && !todo.isCompleted && <Countdown deadline={todo.deadline} now={now} />}
                    </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => onDeleteTodo(todo.id)}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
                </motion.div>
            )
          })}
        </AnimatePresence>
        {todos.length === 0 && (
            <div className="text-center py-10 text-gray-500 text-sm flex flex-col items-center justify-center h-full">
                <svg className="w-24 h-24 text-gray-200 dark:text-gray-700 mb-4" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M40 6H16C14.8954 6 14 6.89543 14 8V56C14 57.1046 14.8954 58 16 58H48C49.1046 58 50 57.1046 50 56V20L40 6Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M38 6V22H50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M24 44L30 38L34 42L42 34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="font-bold text-base text-gray-600 dark:text-gray-400">All clear!</span>
                <p className="mt-1">Ready to add a new task?</p>
            </div>
        )}
      </div>
    </div>
  );
};