import React, { useState, useEffect, useMemo } from 'react';
import { UserStats, SavedLecture, UserProfile, Workspace, Note, Language, Todo } from '../types';
import { ChatView } from './ChatView';
import { StudentHub } from './StudentHub';
import { Mic, Clock, Zap, TrendingUp, Search, Tag, Layers, Plus, ArrowRight, Save, Trash2, MessageSquare, RefreshCw, Shuffle, Sun, Moon, LogOut, Globe, Home, BarChart3, Lightbulb, Briefcase, AlertTriangle, Sparkles, Edit2, LayoutDashboard, CheckCircle2 } from 'lucide-react';
import { PRO_TIPS_AR, MOTIVATIONAL_QUOTES_AR } from '../constants/translations';
import { Logo } from './Logo';
import { motion, AnimatePresence } from 'framer-motion';

interface MainDashboardProps {
  user: UserProfile;
  stats: UserStats;
  savedLectures: SavedLecture[];
  workspaces: Workspace[];
  activeWorkspaceId: string;
  generalNotes: Note[];
  todos: Todo[];
  onAddTodo: (data: Omit<Todo, 'id' | 'isCompleted' | 'createdAt'>) => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onUpdateTodo: (id: string, updates: Partial<Todo>) => void;
  onSetActiveWorkspace: (id: string) => void;
  onCreateWorkspace: (name: string, color: string) => void; 
  onDeleteWorkspace: (id: string) => void;
  onUpdateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  onStartLecture: () => void;
  onOpenLecture: (lecture: SavedLecture) => void;
  onOpenNotes: () => void;
  onUpdateQuote: (quote: string) => void;
  onAddGeneralNote: (content: string) => void;
  onDeleteGeneralNote: (id: string) => void;
  t: any;
  lang: Language;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onLogout: () => void;
  onToggleLanguage: () => void;
  onOpenProfile: () => void;
  backgroundUpload?: { isProcessing: boolean; progress: number };
  onOpenUpload?: () => void;
  onActivity?: () => void;
}

const PRO_TIPS_EN = [
  "Ask Buddy to summarize connections between different lectures in this workspace.",
  "Sleep is crucial for memory consolidation. Go take a nap!",
  "Hydrate! Your brain is 73% water. Don't be a raisin.",
  "Try teaching the material to your cat (or Buddy) to reinforce understanding.",
  "Use the Flashcards tab. It's like Tinder for knowledge - swipe right on what you know.",
  "Review 'Unknown' flashcards daily. Turn that red into green.",
  "Take a break. The lecture isn't going anywhere.",
  "Chat with Buddy using specific questions. He loves to feel useful."
];

const MOTIVATIONAL_QUOTES_EN = [
  "Believe you can and you're halfway there.",
  "The beautiful thing about learning is that no one can take it away from you.",
  "It always seems impossible until it’s done.",
  "Don’t let what you cannot do interfere with what you can do.",
  "Success is the sum of small efforts, repeated day in and day out.",
  "The future belongs to those who believe in the beauty of their dreams.",
  "Education is the passport to the future.",
  "Start where you are. Use what you have. Do what you can."
];

const WORKSPACE_COLORS = [
  "#4C6FFF", "#8B5CF6", "#FFD65A", "#EF4444", "#F97316", "#10B981", "#06B6D4", "#EC4899",
];

export const MainDashboard: React.FC<MainDashboardProps> = ({ 
  user, stats, savedLectures, workspaces, activeWorkspaceId, generalNotes, todos, onAddTodo, onToggleTodo, onDeleteTodo, onUpdateTodo, onSetActiveWorkspace, onCreateWorkspace, onDeleteWorkspace, onUpdateWorkspace,
  onStartLecture, onOpenLecture, onOpenNotes, onUpdateQuote, onAddGeneralNote, onDeleteGeneralNote, t, lang, theme, onToggleTheme, onLogout, onToggleLanguage, onOpenProfile, backgroundUpload, onOpenUpload, onActivity
}) => {
  const [activeTab, setActiveTab] = useState<'workspaces' | 'library' | 'buddy' | 'hub'>('workspaces');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceColor, setNewWorkspaceColor] = useState(WORKSPACE_COLORS[0]);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<string | null>(null);
  
  const PRO_TIPS = lang === 'ar' ? PRO_TIPS_AR : PRO_TIPS_EN;
  const MOTIVATIONAL_QUOTES = lang === 'ar' ? MOTIVATIONAL_QUOTES_AR : MOTIVATIONAL_QUOTES_EN;

  const [isEditingQuote, setIsEditingQuote] = useState(false);
  const [tempQuote, setTempQuote] = useState(user.quote || MOTIVATIONAL_QUOTES[0]);
  const [tipIndex, setTipIndex] = useState(0);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const workspaceColor = activeWorkspace?.color || '#4C6FFF';

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 5) return t.greetingNight;
    if (hour < 12) return t.greetingMorning;
    if (hour < 17) return t.greetingAfternoon;
    if (hour < 22) return t.greetingEvening;
    return t.greetingLate;
  }, [t]);

  // Auto-cycle tips
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % PRO_TIPS.length);
    }, 8000); // Auto-cycle every 8 seconds for liveness
    return () => clearInterval(interval);
  }, [PRO_TIPS.length]);

  const handleRefreshTip = () => setTipIndex(prev => (prev + 1) % PRO_TIPS.length);

  const currentWorkspaceLectures = savedLectures.filter(l => l.workspaceId === activeWorkspaceId);
  const allTags = Array.from(new Set(currentWorkspaceLectures.flatMap(l => l.metadata?.tags || [])));

  const filteredLectures = currentWorkspaceLectures.filter(lecture => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const matchesSearch = (lecture.metadata?.title || '').toLowerCase().includes(lowerCaseQuery) || 
                          (lecture.metadata?.subject || '').toLowerCase().includes(lowerCaseQuery) ||
                          (lecture.metadata?.tags || []).some(tag => tag.toLowerCase().includes(lowerCaseQuery));
    const matchesTag = selectedTag ? lecture.metadata?.tags?.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  const buddyContext = useMemo(() => {
    const wsName = workspaces.find(w => w.id === activeWorkspaceId)?.name || 'Current';
    if (currentWorkspaceLectures.length === 0 && generalNotes.length === 0) {
        return `This workspace (${wsName}) is currently empty.`;
    }
    const lecturesText = currentWorkspaceLectures.map(l => `
    [Lecture] Title: ${l.metadata.title}
    Summary: ${l.summary}
    Key Points: ${l.keyPoints.join('; ')}
    `).join('\n\n');
    return `Workspace: ${wsName}\n\n${lecturesText}\n\nNotes: ${generalNotes.map(n => n.content).join('\n')}`;
  }, [activeWorkspaceId, currentWorkspaceLectures, generalNotes, workspaces]);


  const handleCreateWorkspace = (e: React.FormEvent) => {
      e.preventDefault();
      if (newWorkspaceName.trim()) {
          onCreateWorkspace(newWorkspaceName, newWorkspaceColor);
          setNewWorkspaceName('');
          setNewWorkspaceColor(WORKSPACE_COLORS[0]);
          setIsCreatingWorkspace(false);
      }
  }
  
  const handleDeleteConfirm = () => {
      if (workspaceToDelete) {
          onDeleteWorkspace(workspaceToDelete);
          setWorkspaceToDelete(null);
      }
  }

  const handleSaveQuote = () => {
      onUpdateQuote(tempQuote);
      setIsEditingQuote(false);
  }

  const handleShuffleQuote = () => {
      let newQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
      setTempQuote(newQuote);
      onUpdateQuote(newQuote);
  };

  const TABS = [
    { id: 'workspaces', label: t.workspacesTab || "Workspaces" },
    { id: 'library', label: t.library },
    { id: 'buddy', label: t.askBuddy, isAi: true },
    { id: 'hub', label: "Hub" },
  ];

  const visibleTabs = TABS;

  return (
    <div 
      className="min-h-screen flex flex-col relative bg-background text-text transition-colors duration-300"
      style={{ "--primary": workspaceColor } as React.CSSProperties}
    >
      {/* Navbar */}
      <header className="bg-surface/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 px-4 md:px-6 py-3 flex justify-between items-center shadow-sm h-16">
         <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => setActiveTab('workspaces')}>
             <Logo size="sm" />
         </div>
         
         {/* Desktop Tabs - Improved UI */}
         <div className="hidden md:flex items-center bg-transparent mx-auto">
              <div className="flex bg-gray-100 dark:bg-gray-800/50 p-1 rounded-full border border-gray-200 dark:border-white/5 shadow-inner">
                {visibleTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`relative px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 z-10 flex items-center gap-2 ${
                            activeTab === tab.id ? 'text-primary' : 'text-gray-500 hover:text-text'
                        }`}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-surface rounded-full shadow-md border border-gray-200 dark:border-gray-700"
                                style={{ zIndex: -1 }}
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span>{tab.label}</span>
                        {tab.isAi && activeTab !== 'buddy' && (
                            <span className="bg-accent text-white text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider">AI</span>
                        )}
                    </button>
                ))}
              </div>
         </div>

         <div className="flex items-center gap-2 shrink-0">
             <button onClick={onToggleLanguage} className="p-2 text-gray-500 hover:text-primary rounded-full hidden sm:block">
                 <Globe className="w-5 h-5" />
             </button>
             <button onClick={onToggleTheme} className="p-2 text-gray-500 hover:text-primary rounded-full">
                 {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
             </button>
             <button onClick={onOpenProfile} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-bold shadow-md ml-1 ring-2 ring-white dark:ring-gray-900 transition-transform hover:scale-105">
                 {user.name.charAt(0)}
             </button>
             <button onClick={onLogout} className="p-2 text-gray-500 hover:text-red-500 rounded-full ml-1">
                 <LogOut className="w-5 h-5 rtl:rotate-180" />
             </button>
         </div>
      </header>
      
      {/* Mobile Tab Bar */}
      <div className="md:hidden bg-surface border-b border-gray-200 dark:border-gray-800 px-4 sticky top-16 z-20 shadow-sm">
           <div className="flex gap-2 py-3 overflow-x-auto snap-x no-scrollbar">
                <style>{`
                    .no-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    .no-scrollbar {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}</style>
                {visibleTabs.map((tab) => (
                    <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)} 
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all snap-start flex-shrink-0 ${
                                activeTab === tab.id 
                                ? 'bg-primary text-white shadow-md shadow-primary/20' 
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                            }`}
                        >
                            {tab.label}
                    </button>
                ))}
           </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-8 flex flex-col md:flex-row gap-8 relative flex-1">
        
        <div className="flex-1 relative w-full min-w-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 ml-1">
            <span className="flex items-center gap-1 hover:text-text cursor-pointer" onClick={() => setActiveTab('workspaces')}>
                <Home className="w-3.5 h-3.5" />
            </span>
            <div className="w-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            <span className="text-primary font-semibold">
                {TABS.find(tab => tab.id === activeTab)?.label}
            </span>
             {activeWorkspaceId && (
                <>
                   <div className="w-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                   <span className="text-gray-400">{workspaces.find(w => w.id === activeWorkspaceId)?.name}</span>
                </>
             )}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'workspaces' && (
                <motion.div 
                    key="workspaces"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div className="bg-gradient-to-r from-surface to-background border border-gray-200 dark:border-gray-700 rounded-3xl p-6 md:p-8 mb-6 shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <h1 className="font-heading text-2xl md:text-3xl font-bold text-text mb-2">{greeting}, {user.name.split(' ')[0]}!</h1>
                            <div className="mb-6 max-w-xl">
                                {isEditingQuote ? (
                                    <div className="flex gap-2 items-center">
                                        <input 
                                            type="text" 
                                            value={tempQuote}
                                            onChange={(e) => setTempQuote(e.target.value)}
                                            className="flex-1 bg-background/50 border border-primary rounded-lg px-3 py-1 text-sm text-text"
                                            autoFocus
                                            placeholder="Type your own motivation..."
                                        />
                                        <button onClick={handleSaveQuote} className="p-1.5 bg-primary text-white rounded-md hover:bg-blue-600 transition-colors"><Save className="w-4 h-4" /></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 group/quote">
                                        <p className="text-sm md:text-base text-gray-500 italic cursor-pointer line-clamp-2 hover:text-text transition-colors" onClick={() => setIsEditingQuote(true)}>"{user.quote || tempQuote}"</p>
                                        <div className="flex opacity-0 group-hover/quote:opacity-100 transition-opacity gap-1">
                                            <button onClick={() => setIsEditingQuote(true)} className="p-1 text-gray-400 hover:text-primary transition-colors bg-surface rounded-full shadow-sm" title="Edit Quote">
                                                <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button onClick={handleShuffleQuote} className="p-1 text-gray-400 hover:text-secondary transition-colors bg-surface rounded-full shadow-sm" title="Shuffle Quote">
                                                <Shuffle className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-4">
                                <button 
                                    onClick={onStartLecture}
                                    className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all active:scale-95 whitespace-nowrap"
                                >
                                    <Mic className="w-5 h-5" /> {t.captureLecture}
                                </button>
                                <button 
                                    onClick={() => setActiveTab('buddy')}
                                    className="flex-1 sm:flex-none bg-surface border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-text font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap"
                                >
                                    <MessageSquare className="w-5 h-5 text-accent" /> {t.askBuddy}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mb-8">
                       <h2 className="font-heading text-2xl font-bold text-text mb-6 flex items-center gap-2">
                           <Layers className="w-6 h-6 text-gray-400" />
                           {t.workspacesTab || "Workspaces"}
                       </h2>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {workspaces.map(ws => {
                                const lectureCount = savedLectures.filter(l => l.workspaceId === ws.id).length;
                                const isActive = activeWorkspaceId === ws.id;

                                return (
                                    <motion.div 
                                        whileHover={{ y: -5 }}
                                        key={ws.id} 
                                        onClick={() => onSetActiveWorkspace(ws.id)}
                                        className={`group relative p-6 rounded-3xl border transition-all cursor-pointer shadow-sm ${
                                            isActive 
                                              ? 'bg-surface border-primary ring-1 ring-primary shadow-primary/10' 
                                              : 'bg-surface border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                    >
                                        {isActive && (
                                            <div className="absolute top-4 right-4 bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                {t.active || "Active"}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg`} style={{ backgroundColor: ws.color || '#ccc' }}>
                                                {ws.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className={`font-bold text-lg ${isActive ? 'text-primary' : 'text-text'}`}>{ws.name}</h3>
                                                <p className="text-xs text-gray-500">{lectureCount} {t.lecturesCount || "Lectures"}</p>
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-500 mb-6 line-clamp-2">
                                            {t.selectWorkspace || "Click to manage your study materials for"} {ws.name}.
                                        </p>

                                        <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-800 pt-4 mt-auto">
                                            <span className="text-xs font-medium text-gray-400 group-hover:text-primary transition-colors flex items-center gap-1">
                                                 {t.selectWorkspace || "Select Workspace"} <ArrowRight className="w-3 h-3" />
                                            </span>
                                            
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setWorkspaceToDelete(ws.id);
                                                }}
                                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
                                                title={t.deleteWorkspace}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                            
                            {/* Create New Workspace Card */}
                            {isCreatingWorkspace ? (
                                <div className="bg-gray-50 dark:bg-gray-800/30 border border-primary border-dashed rounded-3xl p-6 flex flex-col justify-center">
                                    <form onSubmit={handleCreateWorkspace} className="flex flex-col gap-4">
                                        <h3 className="font-bold text-lg text-text">{t.newWorkspace}</h3>
                                        <input 
                                            autoFocus
                                            type="text" 
                                            value={newWorkspaceName}
                                            onChange={e => setNewWorkspaceName(e.target.value)}
                                            placeholder={t.workspaceName}
                                            className="w-full bg-background border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        />
                                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                            {WORKSPACE_COLORS.map(color => (
                                                <button
                                                  type="button"
                                                  key={color}
                                                  onClick={() => setNewWorkspaceColor(color)}
                                                  className={`w-6 h-6 rounded-full shrink-0 transition-transform ${newWorkspaceColor === color ? 'scale-125 ring-2 ring-offset-2 ring-offset-surface ring-primary' : 'hover:scale-110'}`}
                                                  style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <button 
                                                type="button" 
                                                onClick={() => setIsCreatingWorkspace(false)} 
                                                className="flex-1 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                {t.cancel}
                                            </button>
                                            <button 
                                                type="submit" 
                                                className="flex-1 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                                            >
                                                {t.saveChanges}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => setIsCreatingWorkspace(true)}
                                    className="group border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 text-gray-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all min-h-[200px]"
                                >
                                    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <span className="font-bold">{t.newWorkspace}</span>
                                </button>
                            )}
                       </div>
                    </div>
                </motion.div>
            )}
            
            {activeTab === 'library' && (
                <motion.div 
                    key="library"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div className="flex flex-col gap-4 mb-8">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                             <h2 className="font-heading text-2xl font-bold text-text">{t.library}</h2>
                             <div className="flex gap-3 w-full md:w-auto">
                                <div className="relative flex-1 md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input 
                                        type="text" 
                                        placeholder={t.searchPlaceholder}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-surface border border-gray-700 rounded-xl py-2 pl-9 pr-4 text-sm text-text focus:border-primary focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {allTags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                <button 
                                    onClick={() => setSelectedTag(null)}
                                    className={`px-3 py-1 rounded-full text-sm border transition-all ${!selectedTag ? 'bg-text text-background border-text' : 'bg-transparent text-gray-400 border-gray-700'}`}
                                >
                                    All
                                </button>
                                {allTags.map(tag => (
                                    <button 
                                        key={tag} 
                                        onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                                        className={`px-3 py-1 rounded-full text-sm border transition-all flex items-center gap-1 ${tag === selectedTag ? 'bg-primary text-white border-primary' : 'bg-transparent text-gray-400 border-gray-700'}`}
                                    >
                                        <Tag className="w-3 h-3" /> {tag}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {filteredLectures.map(lecture => (
                            <div key={lecture.id} onClick={() => onOpenLecture(lecture)} className="bg-surface border border-gray-200 dark:border-gray-700 rounded-2xl p-5 md:p-6 cursor-pointer flex flex-col h-full shadow-sm hover:shadow-md hover:border-primary/50 transition-all">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-xs font-bold text-accent uppercase line-clamp-1 max-w-[70%]">{lecture.metadata?.subject}</span>
                                    <span className="text-xs text-gray-500 shrink-0">{new Date(lecture.metadata?.date || Date.now()).toLocaleDateString()}</span>
                                </div>
                                <h3 className="font-heading font-bold text-lg text-text mb-2 line-clamp-2">{lecture.metadata?.title}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-3 flex-1">{lecture.summary}</p>
                                <div className="flex flex-wrap gap-2 mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
                                    {lecture.metadata?.tags?.slice(0,3).map(tag => (
                                        <span key={tag} className="text-xs text-gray-500 bg-black/5 dark:bg-black/20 px-2 py-1 rounded-md">#{tag}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                        
                        <button onClick={onStartLecture} className="border-2 border-dashed border-gray-300 dark:border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-gray-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all min-h-[200px]">
                            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                <Mic className="w-6 h-6" />
                            </div>
                            <span className="font-bold">{t.processNewLecture}</span>
                        </button>
                    </div>
                </motion.div>
            )}

            {activeTab === 'hub' && (
                 <motion.div 
                    key="hub"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                 >
                    <StudentHub 
                        stats={stats}
                        lectures={savedLectures}
                        workspaces={workspaces}
                        todos={todos}
                        activeWorkspace={activeWorkspace}
                        onUpdateWorkspace={onUpdateWorkspace}
                        onAddTodo={onAddTodo}
                        onToggleTodo={onToggleTodo}
                        onDeleteTodo={onDeleteTodo}
                        onUpdateTodo={onUpdateTodo}
                        generalNotes={generalNotes}
                        onAddGeneralNote={onAddGeneralNote}
                        onDeleteGeneralNote={onDeleteGeneralNote}
                        t={t}
                    />
                 </motion.div>
            )}

            {activeTab === 'buddy' && (
                 <motion.div 
                    key="buddy"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-[calc(100vh-200px)] min-h-[500px] flex flex-col"
                 >
                     <div className="mb-4">
                         <h2 className="font-heading text-2xl font-bold text-text flex items-center gap-2">
                             <MessageSquare className="w-6 h-6 text-accent" /> {t.askBuddy}
                         </h2>
                     </div>
                     <div className="flex-1 bg-surface rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden p-2 md:p-4 shadow-inner">
                        <ChatView 
                            key={activeWorkspaceId} 
                            context={buddyContext} 
                            onAddToNotes={onAddGeneralNote} 
                            t={t}
                            language={lang}
                            storageKey={`chat_workspace_${activeWorkspaceId}`}
                        />
                     </div>
                 </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Workspace Delete Confirmation Modal */}
        <AnimatePresence>
            {workspaceToDelete && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={() => setWorkspaceToDelete(null)}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-surface border border-gray-200 dark:border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Trash2 className="w-24 h-24 text-red-500" />
                        </div>
                        
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4 text-red-500">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            
                            <h3 className="text-xl font-bold text-text mb-2">{t.deleteWorkspace}</h3>
                            <p className="text-gray-500 mb-6 leading-relaxed">
                                {t.deleteConfirm} <span className="font-bold text-text">"{workspaces.find(w => w.id === workspaceToDelete)?.name}"</span>?
                                <br />
                                <span className="text-xs mt-2 block text-gray-400">{t.deleteConfirmSub}</span>
                            </p>
                            
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setWorkspaceToDelete(null)}
                                    className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                                >
                                    {t.cancel}
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors shadow-lg shadow-red-500/20 flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {t.delete}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, index = 0 }: any) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ y: -5 }}
        className="bg-[#1E293B] dark:bg-[#1E293B] bg-white border border-gray-200 dark:border-gray-700/50 p-6 rounded-2xl shadow-sm flex flex-col justify-between h-full min-h-[140px] relative overflow-hidden group"
    >
        <div className="flex items-center gap-3 mb-4 relative z-10">
             <div className="shrink-0">
                {React.cloneElement(icon, { size: 20, strokeWidth: 2.5 })} 
             </div>
             <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{label}</span>
        </div>
        
        <div className="text-3xl font-bold text-gray-900 dark:text-white font-heading relative z-10">
            {value}
        </div>

        {/* Decorative gradient blob */}
        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-white/5 to-white/0 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500"></div>
    </motion.div>
);

const ShortcutBtn = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-primary/10 hover:text-primary rounded-xl border border-gray-200 dark:border-gray-700 transition-all hover:-translate-y-1">
        <Icon className="w-6 h-6 text-gray-400 mb-2" />
        <span className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300 text-center">{label}</span>
    </button>
);