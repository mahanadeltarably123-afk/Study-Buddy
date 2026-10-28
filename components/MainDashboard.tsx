
import React, { useState, useEffect, useMemo } from 'react';
import { UserStats, SavedLecture, UserProfile, Workspace, Note, Language } from '../types';
import { NotesView } from './NotesView';
import { ChatView } from './ChatView';
import { AnalyticsView } from './AnalyticsView';
import { PomodoroView } from './PomodoroView';
import { Mic, Clock, Zap, TrendingUp, Search, Filter, Tag, Lock, Layers, Plus, ArrowRight, Edit2, Save, Trash2, AlertCircle, MessageSquare, RefreshCw, Shuffle, Sun, Moon, LogOut, Globe, FileText, Sparkles, Loader2, ChevronRight, Home, BarChart3 } from 'lucide-react';
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
  onSetActiveWorkspace: (id: string) => void;
  onCreateWorkspace: (name: string, color: string) => void; 
  onDeleteWorkspace: (id: string) => void;
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
  "Use the Flashcards tab to test your active recall regularly.",
  "Group related lectures into specific workspaces for better context.",
  "Export your study notes to Word for offline reviewing.",
  "Review your 'Unknown' flashcards daily to turn them into 'Known'.",
  "Chat with Buddy using specific questions for more detailed answers.",
  "Take short breaks between study sessions to improve retention.",
  "Try teaching the material to Buddy to reinforce your understanding."
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
  user, stats, savedLectures, workspaces, activeWorkspaceId, generalNotes, onSetActiveWorkspace, onCreateWorkspace, onDeleteWorkspace,
  onStartLecture, onOpenLecture, onOpenNotes, onUpdateQuote, onAddGeneralNote, onDeleteGeneralNote, t, lang, theme, onToggleTheme, onLogout, onToggleLanguage, onOpenProfile, backgroundUpload, onOpenUpload, onActivity
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'library' | 'notes' | 'buddy' | 'analytics' | 'pomodoro'>('overview');
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

  const currentWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const workspaceColor = currentWorkspace?.color || '#4C6FFF';

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 5) return t.greetingNight;
    if (hour < 12) return t.greetingMorning;
    if (hour < 17) return t.greetingAfternoon;
    if (hour < 22) return t.greetingEvening;
    return t.greetingLate;
  }, [t]);

  const handleRefreshTip = () => setTipIndex(prev => (prev + 1) % PRO_TIPS.length);

  const currentWorkspaceLectures = savedLectures.filter(l => l.workspaceId === activeWorkspaceId || (!l.workspaceId && activeWorkspaceId === 'default'));
  const allTags = Array.from(new Set(currentWorkspaceLectures.flatMap(l => l.metadata?.tags || [])));

  const filteredLectures = currentWorkspaceLectures.filter(lecture => {
    const matchesSearch = (lecture.metadata?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (lecture.metadata?.subject || '').toLowerCase().includes(searchQuery.toLowerCase());
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
    { id: 'overview', label: t.overview },
    { id: 'library', label: t.library },
    { id: 'buddy', label: t.askBuddy, isAi: true },
    { id: 'pomodoro', label: 'Pomodoro' },
    { id: 'notes', label: t.generalNotes },
    { id: 'analytics', label: t.analytics },
  ];

  const visibleTabs = user.isGuest ? TABS.filter(tab => tab.id === 'overview') : TABS;

  return (
    <div 
      className="min-h-screen flex flex-col relative bg-background text-text transition-colors duration-300"
      style={{ "--primary": workspaceColor } as React.CSSProperties}
    >
      {/* Navbar */}
      <header className="bg-surface/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 px-4 md:px-6 py-3 flex justify-between items-center shadow-sm h-16">
         <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => setActiveTab('overview')}>
             <Logo size="sm" />
         </div>
         
         {/* Desktop Tabs */}
         <div className="hidden lg:flex items-center bg-gray-100 dark:bg-gray-800/50 p-1 rounded-full border border-gray-200 dark:border-white/5 shadow-inner mx-auto max-w-2xl">
              {visibleTabs.map((tab) => (
                  <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`relative px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 z-10 ${
                          activeTab === tab.id ? 'text-primary' : 'text-gray-500 hover:text-text'
                      }`}
                  >
                      {activeTab === tab.id && (
                          <motion.div
                              layoutId="activeTab"
                              className="absolute inset-0 bg-surface rounded-full shadow-sm border border-gray-200 dark:border-gray-700"
                              style={{ zIndex: -1 }}
                          />
                      )}
                      <span className="flex items-center gap-2">
                          {tab.label}
                          {tab.isAi && activeTab !== 'buddy' && (
                              <span className="bg-accent text-white text-[10px] px-1.5 rounded-full">AI</span>
                          )}
                      </span>
                  </button>
              ))}
         </div>

         <div className="flex items-center gap-2 shrink-0">
             <button onClick={onToggleLanguage} className="p-2 text-gray-500 hover:text-primary rounded-full hidden sm:block">
                 <Globe className="w-5 h-5" />
             </button>
             <button onClick={onToggleTheme} className="p-2 text-gray-500 hover:text-primary rounded-full">
                 {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
             </button>
             <button onClick={onOpenProfile} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-bold shadow-md ml-1 ring-2 ring-white dark:ring-gray-900">
                 {user.name.charAt(0)}
             </button>
             <button onClick={onLogout} className="p-2 text-gray-500 hover:text-red-500 rounded-full ml-1">
                 <LogOut className="w-5 h-5 rtl:rotate-180" />
             </button>
         </div>
      </header>
      
      {/* Mobile Tab Bar - Improved */}
      <div className="lg:hidden bg-surface border-b border-gray-200 dark:border-gray-800 px-4 sticky top-16 z-20 shadow-sm">
           <div className="flex gap-2 py-3 overflow-x-auto snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`
                    .lg\\:hidden > div::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
                {visibleTabs.map((tab) => (
                    <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)} 
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all snap-start ${
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
        {/* Sidebar (Desktop Only for now) */}
        <div className="hidden md:flex flex-col w-64 shrink-0 space-y-6 pt-2 sticky top-24 self-start h-fit">
            <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2 font-heading">{t.workspaces}</h3>
                <div className="space-y-1">
                    {workspaces.map(ws => (
                         <div key={ws.id} className="group relative flex items-center">
                            <button
                                onClick={() => onSetActiveWorkspace(ws.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-start ${
                                    activeWorkspaceId === ws.id 
                                      ? 'bg-background shadow-sm border border-primary/30' 
                                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                            >
                                <span 
                                  className={`w-3 h-3 rounded-full flex-shrink-0 transition-transform duration-300 ${activeWorkspaceId === ws.id ? 'scale-110 ring-2 ring-offset-1 ring-offset-surface' : ''}`} 
                                  style={{ backgroundColor: ws.color || '#ccc', boxShadow: activeWorkspaceId === ws.id ? `0 0 8px ${ws.color}` : 'none' }}
                                ></span>
                                <span className={`truncate flex-1 ${ws.id !== 'default' ? 'pr-6 rtl:pr-0 rtl:pl-6' : ''} ${activeWorkspaceId === ws.id ? 'text-primary font-bold' : ''}`}>{ws.name}</span>
                            </button>
                            {ws.id !== 'default' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setWorkspaceToDelete(ws.id);
                                    }}
                                    className="absolute right-2 rtl:right-auto rtl:left-2 p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                         </div>
                    ))}
                </div>
                
                {isCreatingWorkspace ? (
                    <motion.form 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        onSubmit={handleCreateWorkspace} 
                        className="mt-4 px-2 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex gap-2 mb-3 overflow-x-auto pb-2 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
                            {WORKSPACE_COLORS.map(color => (
                                <button
                                  type="button"
                                  key={color}
                                  onClick={() => setNewWorkspaceColor(color)}
                                  className={`w-5 h-5 rounded-full shrink-0 ${newWorkspaceColor === color ? 'ring-2 ring-offset-1 ring-offset-surface scale-110' : ''}`}
                                  style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                        <input 
                          autoFocus
                          type="text" 
                          value={newWorkspaceName}
                          onChange={e => setNewWorkspaceName(e.target.value)}
                          placeholder={t.workspaceName}
                          className="w-full bg-background border border-primary rounded-lg px-2 py-1.5 text-sm mb-2 outline-none text-text"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                            <button type="button" onClick={() => setIsCreatingWorkspace(false)} className="text-xs text-gray-500">{t.cancel}</button>
                            <button type="submit" className="text-xs bg-primary text-white px-3 py-1 rounded-md">{t.saveChanges}</button>
                        </div>
                    </motion.form>
                ) : (
                  <button 
                      onClick={() => setIsCreatingWorkspace(true)}
                      className="mt-4 w-full flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded-xl transition-colors group font-medium"
                  >
                      <Plus className="w-4 h-4" /> {t.newWorkspace}
                  </button>
                )}
            </div>
        </div>

        <div className="flex-1 relative w-full min-w-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 ml-1">
            <span className="flex items-center gap-1 hover:text-text cursor-pointer" onClick={() => setActiveTab('overview')}>
                <Home className="w-3.5 h-3.5" />
            </span>
            <ChevronRight className="w-3 h-3 text-gray-400 rtl:rotate-180" />
            <span className="text-primary font-semibold">
                {TABS.find(tab => tab.id === activeTab)?.label}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
                <motion.div 
                    key="overview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div className="bg-gradient-to-r from-surface to-background border border-gray-200 dark:border-gray-700 rounded-3xl p-6 md:p-8 mb-8 shadow-lg relative overflow-hidden">
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
                                        />
                                        <button onClick={handleSaveQuote} className="p-1 bg-primary text-white rounded-md"><Save className="w-4 h-4" /></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 group/quote">
                                        <p className="text-sm md:text-base text-gray-500 italic cursor-pointer line-clamp-2" onClick={() => setIsEditingQuote(true)}>"{user.quote || tempQuote}"</p>
                                        <button onClick={handleShuffleQuote} className="p-1 text-gray-400 hover:text-secondary shrink-0"><Shuffle className="w-3 h-3" /></button>
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

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8">
                        <StatCard 
                            icon={<Clock className="text-accent" />} 
                            label={t.studyHours}
                            value={stats.studyHours.toFixed(1)} 
                        />
                        <StatCard 
                            icon={<TrendingUp className="text-emerald-400" />} 
                            label={t.streak} 
                            value={`${stats.streakDays} ${t.streak || "Days"}`} 
                        />
                        <StatCard 
                            icon={<Zap className="text-primary" />} 
                            label={t.activeFlashcards} 
                            value={stats.activeFlashcards.toString()} 
                        />
                        <StatCard 
                            icon={<BarChart3 className="text-purple-500" />} 
                            label="Lectures" 
                            value={stats.completedLectures.toString()} 
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-surface border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:shadow-lg transition-all">
                            <h2 className="font-heading text-xl font-bold text-text mb-6">{t.shortcuts}</h2>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <ShortcutBtn icon={Mic} label={t.newCapture} onClick={onStartLecture} />
                                <ShortcutBtn icon={Layers} label={t.library} onClick={() => setActiveTab('library')} />
                                <ShortcutBtn icon={Zap} label={t.flashcards} onClick={() => setActiveTab('library')} />
                                <ShortcutBtn icon={TrendingUp} label={t.analytics} onClick={() => setActiveTab('analytics')} />
                            </div>
                        </div>
                        
                        <div className="lg:col-span-2 bg-surface border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:shadow-lg transition-all">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="font-heading text-xl font-bold text-text flex items-center gap-3">
                                    <Logo size="sm" /> {t.recentLectures}
                                </h2>
                                {!user.isGuest && <button onClick={() => setActiveTab('library')} className="text-sm text-primary hover:underline">{t.viewAll}</button>}
                            </div>
                            {currentWorkspaceLectures.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">{t.noLectures}</div>
                            ) : (
                                <div className="space-y-3">
                                    {currentWorkspaceLectures.slice(0, 3).map(lecture => (
                                        <div key={lecture.id} onClick={() => onOpenLecture(lecture)} className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer transition-all flex justify-between items-center group">
                                            <div>
                                                <h4 className="text-text font-medium group-hover:text-primary transition-colors line-clamp-1">{lecture.metadata?.title}</h4>
                                                <p className="text-xs md:text-sm text-gray-500">{new Date(lecture.metadata?.date || Date.now()).toLocaleDateString()}</p>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors rtl:rotate-180" />
                                        </div>
                                    ))}
                                </div>
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

            {activeTab === 'pomodoro' && (
                <motion.div 
                    key="pomodoro"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-4"
                >
                    <div className="mb-6 text-center">
                        <h2 className="font-heading text-2xl font-bold text-text">Pomodoro Focus Timer</h2>
                        <p className="text-sm text-gray-500 mt-1">Boost retention using scientifically timed focus and rest intervals.</p>
                    </div>
                    <PomodoroView t={t} onSessionComplete={() => { if (onActivity) onActivity(); }} />
                </motion.div>
            )}

            {activeTab === 'analytics' && (
                 <motion.div 
                    key="analytics"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                 >
                    <AnalyticsView stats={stats} lectures={savedLectures} workspaces={workspaces} t={t} />
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
                        />
                     </div>
                 </motion.div>
            )}

            {activeTab === 'notes' && (
                <motion.div 
                    key="notes"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-[calc(100vh-200px)] min-h-[500px]"
                >
                    <div className="mb-6 flex justify-between items-end">
                        <h2 className="font-heading text-2xl font-bold text-text">{t.generalNotes}</h2>
                    </div>
                    <NotesView 
                        notes={generalNotes} 
                        onAddNote={onAddGeneralNote} 
                        onDeleteNote={onDeleteGeneralNote} 
                        t={t}
                    />
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }: any) => (
    <div className="bg-surface p-4 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col justify-center">
        <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg shrink-0">{icon}</div>
            <h4 className="text-gray-500 text-xs font-medium uppercase tracking-wider">{label}</h4>
        </div>
        <span className="text-2xl md:text-3xl font-bold text-text font-heading ml-1 truncate">{value}</span>
    </div>
);

const ShortcutBtn = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-primary/10 hover:text-primary rounded-xl border border-gray-200 dark:border-gray-700 transition-all hover:-translate-y-1">
        <Icon className="w-6 h-6 text-gray-400 mb-2" />
        <span className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300 text-center">{label}</span>
    </button>
);
