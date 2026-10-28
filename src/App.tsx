
import React, { useState, useEffect, useRef } from 'react';
import { LandingPage } from './components/LandingPage';
import { Auth } from './components/Auth';
import { MainDashboard } from './components/MainDashboard';
import { UploadSection } from './components/UploadSection';
import { ProfileView } from './components/ProfileView';
import { QuizView } from './components/QuizView';
import { FlashcardsView } from './components/FlashcardsView';
import { MindMapView } from './components/MindMapView';
import { AppView, AuthMode, Language, SavedLecture, UserProfile, Workspace, Note, UserStats, TranscriptSegment, StudyContent, Todo } from './types';
import { translations } from './constants/translations';
import { geminiService } from './services/geminiService';
import { ArrowLeft, Volume2, CheckCircle2, StopCircle, FileText, AlignLeft, Globe, Sun, Moon, LogOut, Languages, RefreshCw, Star, Play, Pause } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Logo } from './components/Logo';

const DEFAULT_WORKSPACES: Workspace[] = [
  { id: 'cs101', name: 'Computer Science', color: '#8B5CF6' }
];

const MOCK_LECTURES: SavedLecture[] = [
  {
    id: '1',
    workspaceId: 'cs101',
    metadata: {
      title: "Introduction to Neural Networks",
      subject: "Computer Science",
      tags: ["AI", "Deep Learning"],
      date: Date.now() - 100000000
    },
    summary: "This lecture provides an in-depth introduction to Artificial Neural Networks (ANNs), foundational to deep learning. It begins by tracing the history from the McCulloch-Pitts neuron to the perceptron. The core architecture is explained: input layers receiving data, hidden layers processing features through weighted connections, and output layers delivering predictions.\n\nKey components like weights (strength of connections), biases (shifting activation), and activation functions (Sigmoid, ReLU, Tanh) are detailed. The lecture emphasizes how non-linearity allows the network to learn complex patterns. The learning process itself is broken down into forward propagation (prediction) and backpropagation (error minimization via gradient descent), showing how the network iteratively adjusts to improve accuracy.",
    transcript: "00:00 - Professor: Good morning everyone. Today we are starting a very exciting topic: Artificial Neural Networks.\n00:10 - Now, why are they called neural networks? Because they are loosely inspired by the biological neural networks in our brains.\n01:30 - Let's start with the perceptron. Think of it as the simplest form of a neuron. It takes several inputs, multiplies them by weights, adds them up, adds a bias, and then passes the result through an activation function.\n05:45 - Crucially, without activation functions like ReLU or Sigmoid, a neural network would just be a big linear regression model. The magic happens with non-linearity.\n10:20 - We then move to backpropagation. This is the algorithm that allows the network to learn from its mistakes by calculating the gradient of the loss function with respect to each weight.",
    keyPoints: ["Perceptron structure & History", "Sigmoid, Tanh vs ReLU", "Gradient Descent Optimization", "Backpropagation Algorithm", "Loss Functions & Error Minimization"],
    flashcards: [
      { front: "What is a perceptron?", back: "A single-layer neural network linear classifier." },
      { front: "What does ReLU stand for?", back: "Rectified Linear Unit." }
    ],
    quiz: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: "Which activation function is commonly used in hidden layers to avoid vanishing gradients?",
        options: ["Sigmoid", "Tanh", "ReLU", "Softmax"],
        correctAnswerIndex: 2,
        explanation: "ReLU is preferred in hidden layers because it is computationally efficient and does not saturate for positive values, helping with the vanishing gradient problem."
      }
    ]
  }
];

function App() {
  // -- State --
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // Data State
  const [workspaces, setWorkspaces] = useState<Workspace[]>(DEFAULT_WORKSPACES);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('cs101');
  const [lectures, setLectures] = useState<SavedLecture[]>(MOCK_LECTURES);
  const [generalNotes, setGeneralNotes] = useState<Note[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [stats, setStats] = useState<UserStats>({ studyHours: 0, completedLectures: 1, activeFlashcards: 0, streakDays: 0, activityLog: [] });
  
  // Processing State
  const [uploadState, setUploadState] = useState({
      isProcessing: false,
      progress: 0,
      file: null as File | null
  });
  const [activeLecture, setActiveLecture] = useState<SavedLecture | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const uploadCancelRef = useRef(false);
  
  // Text to Speech State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [playingSegmentIndex, setPlayingSegmentIndex] = useState<number | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Sub-view state for Dashboard
  const [dashboardSubView, setDashboardSubView] = useState<'upload' | 'study' | null>(null);
  const [activeStudyTab, setActiveStudyTab] = useState<'summary' | 'transcript'>('summary');
  
  // Structured Transcript State
  const [parsedTranscript, setParsedTranscript] = useState<TranscriptSegment[]>([]);

  const t = translations[language];

  // -- Effects --

  // Load Todos from localStorage
  useEffect(() => {
    const savedTodos = localStorage.getItem('studyBuddyTodos');
    if (savedTodos) {
      try {
        setTodos(JSON.parse(savedTodos));
      } catch (e) {
        console.error("Failed to parse todos from localStorage");
      }
    }
  }, []);

  // Save Todos to localStorage
  useEffect(() => {
    localStorage.setItem('studyBuddyTodos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    if (language === 'ar') {
        document.body.style.fontFamily = "'Cairo', sans-serif";
    } else {
        document.body.style.fontFamily = "'Inter', sans-serif";
    }
  }, [language]);

  // Process transcript when lecture changes
  useEffect(() => {
    if (activeLecture) {
        if (Array.isArray(activeLecture.transcript)) {
            setParsedTranscript(activeLecture.transcript);
        } else if (typeof activeLecture.transcript === 'string') {
            // Parse legacy string format
            const segments = parseTranscriptString(activeLecture.transcript, activeLecture.keyPoints);
            setParsedTranscript(segments);
        } else {
            setParsedTranscript([]);
        }
        // Stop any ongoing speech when switching lectures
        stopSpeech();
    }
  }, [activeLecture]);

  const parseTranscriptString = (text: string, keyPoints: string[]): TranscriptSegment[] => {
      // Split by timestamps if possible (Format: MM:SS - Text)
      // Or split by newlines if timestamps aren't consistent
      const lines = text.split('\n').filter(l => l.trim());
      const regex = /(\d{1,2}:\d{2})\s*-\s*(.*)/;
      
      return lines.map(line => {
          const match = line.match(regex);
          const timestamp = match ? match[1] : '';
          const content = match ? match[2] : line;
          
          // Heuristic to determine if this segment is a key point
          // Check if any significant word from keyPoints appears in the text
          const isKeyPoint = keyPoints.some(kp => {
             const keywords = kp.toLowerCase().split(' ').filter(w => w.length > 4); // Filter short words
             const contentLower = content.toLowerCase();
             return keywords.some(kw => contentLower.includes(kw));
          });

          return {
              timestamp: timestamp || "00:00",
              text: content,
              isKeyPoint
          };
      });
  };

  const logActivity = () => {
      setStats(prev => ({
          ...prev,
          activityLog: [...(prev.activityLog || []), Date.now()]
      }));
  };

  // Stats Logic
  useEffect(() => {
      if (user) {
          const lastLogin = localStorage.getItem('lastStudyDate');
          const today = new Date().toDateString();
          const flashcardCount = lectures.reduce((acc, curr) => acc + (curr.flashcards ? curr.flashcards.length : 0), 0);
          let streak = stats.streakDays;

          if (lastLogin !== today) {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              if (lastLogin === yesterday.toDateString()) {
                  streak += 1;
              } else if (lastLogin) {
                  streak = 1;
              } else {
                  streak = 1;
              }
              localStorage.setItem('lastStudyDate', today);
          }

          setStats(prev => ({ 
              ...prev, 
              streakDays: streak,
              activeFlashcards: flashcardCount,
              completedLectures: lectures.length
          }));
      }
  }, [user, lectures.length]);

  useEffect(() => {
      let interval: any;
      let activityLogger: any;

      if (dashboardSubView === 'study' && !document.hidden) {
          interval = setInterval(() => {
             setStats(prev => ({ ...prev, studyHours: prev.studyHours + (1/3600) }));
          }, 1000);
          activityLogger = setInterval(() => {
             logActivity();
          }, 5 * 60 * 1000);
      }
      return () => {
          clearInterval(interval);
          clearInterval(activityLogger);
      };
  }, [dashboardSubView]);

  useEffect(() => {
    return () => {
        stopSpeech();
    };
  }, [dashboardSubView]);

  useEffect(() => {
      if (activeLecture) {
          setActiveStudyTab('summary');
      }
  }, [activeLecture]);

  const toggleLanguage = () => setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const stopSpeech = () => {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setPlayingSegmentIndex(null);
  };

  const playSegment = (index: number) => {
      window.speechSynthesis.cancel();
      
      if (index >= parsedTranscript.length) {
          setIsSpeaking(false);
          setPlayingSegmentIndex(null);
          return;
      }

      setPlayingSegmentIndex(index);
      setIsSpeaking(true);

      const text = parsedTranscript[index].text;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'ar' ? 'ar-SA' : 'en-US';
      utterance.rate = 1.0;
      
      utterance.onend = () => {
          playSegment(index + 1); // Auto play next
      };
      
      utterance.onerror = () => {
          setIsSpeaking(false);
          setPlayingSegmentIndex(null);
      };

      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      
      // Auto-scroll to element
      const el = document.getElementById(`transcript-seg-${index}`);
      if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
  };

  const toggleFullSpeech = (text: string) => {
    if (activeStudyTab === 'transcript') {
        if (isSpeaking) {
            stopSpeech();
        } else {
            playSegment(0);
        }
    } else {
        // Summary Mode
        if (isSpeaking) {
            stopSpeech();
        } else {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = language === 'ar' ? 'ar-SA' : 'en-US';
            utterance.rate = 0.9;
            utterance.onend = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
            setIsSpeaking(true);
        }
    }
  };

  const handleAuthComplete = (userProfile?: UserProfile, token?: string, isGuest = false) => {
      if (isGuest) {
          setUser({ name: "Guest User", email: "", isGuest: true });
      } else if (userProfile) {
          setUser(userProfile);
      }
      setCurrentView('dashboard');
  };

  const handleLogout = () => {
      setUser(null);
      setCurrentView('landing');
      setActiveWorkspaceId('cs101');
      setDashboardSubView(null);
      setActiveLecture(null);
  };

  const handleFileUpload = async (file: File) => {
      uploadCancelRef.current = false;
      setUploadState({ isProcessing: true, progress: 0, file });
      const stepInterval = setInterval(() => {
          setUploadState(prev => ({ ...prev, progress: (prev.progress + 1) % 5 }));
      }, 2000);

      try {
          const content = await geminiService.processLecture(file);
          
          if (uploadCancelRef.current) return;

          clearInterval(stepInterval);
          setUploadState({ isProcessing: false, progress: 5, file: null });
          
          const newLecture: SavedLecture = {
              ...content,
              id: Date.now().toString(),
              workspaceId: activeWorkspaceId
          };

          setLectures(prev => [newLecture, ...prev]);
          logActivity();
          setActiveLecture(newLecture);
          setDashboardSubView('study');
      } catch (error) {
          if (uploadCancelRef.current) return;
          console.error(error);
          setUploadState({ isProcessing: false, progress: 0, file: null });
          alert("Failed to process lecture. Please try again.");
      } finally {
          clearInterval(stepInterval);
      }
  };

  const handleCancelUpload = () => {
      uploadCancelRef.current = true;
      setUploadState({ isProcessing: false, progress: 0, file: null });
  };
  
  const handleAddGeneralNote = (content: string) => {
      setGeneralNotes(prev => [...prev, { id: Date.now().toString(), content, timestamp: Date.now() }]);
      logActivity();
  };

  const handleAddTodo = (todoData: Omit<Todo, 'id' | 'isCompleted' | 'createdAt'>) => {
    const newTodo: Todo = {
        ...todoData,
        id: Date.now().toString(),
        isCompleted: false,
        createdAt: Date.now(),
    };
    setTodos(prev => [newTodo, ...prev]);
  };
  
  const handleUpdateTodo = (id: string, updates: Partial<Todo>) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleToggleTodo = (id: string) => {
      setTodos(prev => prev.map(todo => todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo));
  };

  const handleDeleteTodo = (id: string) => {
      setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  const handleUpdateWorkspace = (workspaceId: string, updates: Partial<Workspace>) => {
      setWorkspaces(prev => prev.map(ws => ws.id === workspaceId ? { ...ws, ...updates } : ws));
  };

  const handleTranslateLecture = async () => {
      if (!activeLecture) return;
  
      // Case 1: The lecture is currently showing a translation. Revert to original.
      if (activeLecture.isTranslated && activeLecture.originalContent) {
          const originalVersion: SavedLecture = {
              ...activeLecture.originalContent,
              id: activeLecture.id,
              workspaceId: activeLecture.workspaceId,
              isTranslated: false,
              originalContent: undefined,
          };
          setActiveLecture(originalVersion);
          setLectures(prev => prev.map(l => l.id === originalVersion.id ? originalVersion : l));
          return;
      }
  
      // Case 2: The lecture is original. Translate it.
      if (!activeLecture.isTranslated) {
          setIsTranslating(true);
          try {
              // Store the current state as the original content before translating
              const originalForSaving: StudyContent = {
                  metadata: activeLecture.metadata,
                  summary: activeLecture.summary,
                  transcript: activeLecture.transcript,
                  keyPoints: activeLecture.keyPoints,
                  flashcards: activeLecture.flashcards,
                  quiz: activeLecture.quiz,
                  mindMap: activeLecture.mindMap,
                  notes: activeLecture.notes,
              };
      
              const targetLang = 'Arabic';
              const translatedContent = await geminiService.translateStudyContent(activeLecture, targetLang);
              
              const translatedLecture: SavedLecture = {
                ...translatedContent,
                id: activeLecture.id,
                workspaceId: activeLecture.workspaceId,
                isTranslated: true,
                originalContent: originalForSaving
              };
      
              setActiveLecture(translatedLecture);
              setLectures(prev => prev.map(l => l.id === translatedLecture.id ? translatedLecture : l));
          } catch (e) {
              console.error("Full translation failed", e);
          } finally {
              setIsTranslating(false);
          }
      }
  };

  const renderContent = () => {
      switch (currentView) {
          case 'landing':
              return (
                  <LandingPage 
                      onGetStarted={() => { setAuthMode('signup'); setCurrentView('auth'); }}
                      onLogin={() => { setAuthMode('login'); setCurrentView('auth'); }}
                      onGuest={() => handleAuthComplete(undefined, undefined, true)}
                      t={t}
                      lang={language}
                      onToggleLanguage={toggleLanguage}
                      theme={theme}
                      onToggleTheme={toggleTheme}
                  />
              );
          
          case 'auth':
              return (
                  <Auth 
                      initialMode={authMode}
                      onComplete={handleAuthComplete}
                      onBack={() => setCurrentView('landing')}
                      t={t}
                      lang={language}
                  />
              );

          case 'profile':
              if (!user) return null;
              return (
                  <div className="min-h-screen bg-background text-text">
                      <ProfileView 
                          user={user} 
                          onUpdateUser={setUser} 
                          onBack={() => setCurrentView('dashboard')} 
                          t={t} 
                      />
                  </div>
              );

          case 'dashboard':
              if (!user) return null;

              return (
                  <div className="min-h-screen bg-background text-text flex flex-col transition-colors duration-300">
                    <AnimatePresence mode="wait">
                      {dashboardSubView === 'study' && activeLecture ? (
                          <motion.div 
                            key="study-view"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col min-h-screen bg-background"
                            style={{ "--primary": workspaces.find(w => w.id === activeLecture.workspaceId)?.color || '#4C6FFF' } as React.CSSProperties}
                          >
                              {/* Sticky Header */}
                              <div className="px-4 md:px-6 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-surface/90 backdrop-blur-md sticky top-0 z-40 shadow-sm h-16">
                                  {/* Left: Back */}
                                  <div className="flex items-center gap-4 flex-1">
                                      <button 
                                        onClick={() => setDashboardSubView(null)} 
                                        className="flex items-center gap-2 text-gray-500 hover:text-primary font-medium transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                      >
                                          <ArrowLeft className="w-5 h-5 rtl:rotate-180" /> 
                                          <span className="hidden sm:inline text-sm">{t.back}</span>
                                      </button>
                                  </div>
                                  
                                  {/* Center: Title */}
                                  <div className="flex-1 flex justify-center">
                                    <h2 className="font-heading font-bold text-base md:text-lg truncate max-w-[200px] md:max-w-md text-text text-center">
                                      {activeLecture.metadata.title}
                                    </h2>
                                  </div>

                                  {/* Right: Actions */}
                                  <div className="flex-1 flex justify-end gap-2">
                                      <button 
                                          onClick={handleTranslateLecture}
                                          disabled={isTranslating}
                                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border text-xs font-bold ${activeLecture.isTranslated ? 'bg-primary text-white border-primary' : 'bg-surface border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary'}`}
                                          title={activeLecture.isTranslated ? "Revert to Original" : "Translate All Content to Arabic"}
                                      >
                                          {isTranslating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                                          <span className="hidden sm:inline">{activeLecture.isTranslated ? "Original" : "Translate"}</span>
                                      </button>
                                      
                                      <button 
                                        onClick={() => toggleFullSpeech(activeStudyTab === 'summary' ? activeLecture.summary : (activeLecture.transcript as string || 'Transcript not available'))}
                                        className={`p-2 rounded-full transition-all shrink-0 ${isSpeaking ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-primary'}`}
                                        title={isSpeaking ? "Stop" : "Read Aloud"}
                                      >
                                          {isSpeaking ? <StopCircle className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                      </button>
                                  </div>
                              </div>
                              
                              {/* Main Study Content Grid */}
                              <div className="flex-1 container mx-auto p-4 md:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6" dir={language === 'ar' || activeLecture.isTranslated ? 'rtl' : 'ltr'}>
                                  {/* Left Column: Content & Mind Map */}
                                  <div className="xl:col-span-7 space-y-6 min-w-0">
                                      {/* Content Card */}
                                      <div className="bg-surface rounded-3xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden group min-h-[500px] flex flex-col">
                                          <div className="bg-surface/90 border-b border-gray-200 dark:border-gray-800 p-3 md:p-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
                                              <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                                                  <button 
                                                      onClick={() => setActiveStudyTab('summary')}
                                                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all ${activeStudyTab === 'summary' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-500 hover:text-text'}`}
                                                  >
                                                      <AlignLeft className="w-4 h-4" />
                                                      <span className="hidden xs:inline">{t.summary}</span>
                                                  </button>
                                                  <button 
                                                      onClick={() => setActiveStudyTab('transcript')}
                                                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all ${activeStudyTab === 'transcript' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-500 hover:text-text'}`}
                                                  >
                                                      <FileText className="w-4 h-4" />
                                                      <span className="hidden xs:inline">{t.transcript || "Transcript"}</span>
                                                  </button>
                                              </div>
                                          </div>
                                          
                                          <div className="p-0 flex-1 overflow-hidden relative">
                                              <AnimatePresence mode="wait">
                                                  {activeStudyTab === 'summary' ? (
                                                      <motion.div
                                                          key="summary"
                                                          initial={{ opacity: 0 }}
                                                          animate={{ opacity: 1 }}
                                                          exit={{ opacity: 0 }}
                                                          className="p-5 md:p-8"
                                                      >
                                                          <p className="leading-relaxed text-base md:text-lg text-gray-700 dark:text-gray-300 font-sans tracking-wide whitespace-pre-wrap text-start">
                                                              {activeLecture.summary}
                                                          </p>
                                                      </motion.div>
                                                  ) : (
                                                      <motion.div
                                                          key="transcript"
                                                          initial={{ opacity: 0 }}
                                                          animate={{ opacity: 1 }}
                                                          exit={{ opacity: 0 }}
                                                          className="h-full max-h-[600px] overflow-y-auto custom-scrollbar"
                                                      >
                                                          {parsedTranscript.length > 0 ? (
                                                              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                                                  {parsedTranscript.map((segment, idx) => (
                                                                      <div 
                                                                        id={`transcript-seg-${idx}`}
                                                                        key={idx} 
                                                                        onClick={() => playSegment(idx)}
                                                                        className={`
                                                                            group p-4 transition-all cursor-pointer flex gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50
                                                                            ${playingSegmentIndex === idx ? 'bg-primary/10 border-l-4 border-primary' : 'border-l-4 border-transparent'}
                                                                        `}
                                                                      >
                                                                          <div className="shrink-0 pt-0.5">
                                                                              <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded hover:text-primary hover:bg-primary/10 transition-colors">
                                                                                  {segment.timestamp}
                                                                              </span>
                                                                          </div>
                                                                          <div className="flex-1">
                                                                              <p className={`text-sm md:text-base leading-relaxed ${playingSegmentIndex === idx ? 'text-primary font-medium' : 'text-gray-600 dark:text-gray-300'}`}>
                                                                                  {segment.text}
                                                                              </p>
                                                                              {segment.isKeyPoint && (
                                                                                  <div className="mt-2 flex items-center gap-1 text-xs font-bold text-accent">
                                                                                      <Star className="w-3 h-3 fill-accent" />
                                                                                      <span>Key Concept</span>
                                                                                  </div>
                                                                              )}
                                                                          </div>
                                                                          <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center">
                                                                              <button className="p-1.5 rounded-full bg-primary text-white shadow-md hover:scale-110 transition-transform">
                                                                                  <Play className="w-3 h-3" />
                                                                              </button>
                                                                          </div>
                                                                      </div>
                                                                  ))}
                                                                  <div className="h-20"></div> {/* Bottom padding for scrolling */}
                                                              </div>
                                                          ) : (
                                                              <div className="text-center py-12 text-gray-400 italic">
                                                                  No transcript available for this lecture.
                                                              </div>
                                                          )}
                                                      </motion.div>
                                                  )}
                                              </AnimatePresence>
                                          </div>
                                      </div>

                                      {/* Key Points Grid */}
                                      <div className="bg-surface rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 md:p-6">
                                          <h3 className="text-lg font-bold mb-4 text-primary font-heading flex items-center gap-2">
                                               <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                                               {language === 'ar' || activeLecture.isTranslated ? 'النقاط الرئيسية' : 'Key Points'}
                                          </h3>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                              {activeLecture.keyPoints.map((kp, i) => (
                                                  <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700/50">
                                                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                                      <span className="text-sm text-gray-700 dark:text-gray-300 font-medium text-start">{kp}</span>
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                      
                                      {/* Mind Map */}
                                      <div className="bg-surface rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 md:p-6 h-[500px]" dir="ltr">
                                          <MindMapView 
                                                summary={activeLecture.summary} 
                                                keyPoints={activeLecture.keyPoints}
                                                existingMap={activeLecture.mindMap}
                                                onSaveMap={(map) => {
                                                    const updated = { ...activeLecture, mindMap: map };
                                                    setActiveLecture(updated);
                                                    setLectures(prev => prev.map(l => l.id === updated.id ? updated : l));
                                                }}
                                                t={t}
                                          />
                                      </div>
                                  </div>
                                  
                                  {/* Right Column: Interactive Tools */}
                                  <div className="xl:col-span-5 space-y-6 min-w-0">
                                      {/* Flashcards */}
                                      <div className="bg-surface rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl p-2 overflow-hidden">
                                          <div className="bg-gray-50 dark:bg-black/20 rounded-[20px] p-4 min-h-[350px]">
                                              <FlashcardsView 
                                                  cards={activeLecture.flashcards} 
                                                  t={t} 
                                                  onSessionComplete={logActivity}
                                              />
                                          </div>
                                      </div>
                                      
                                      {/* Quiz */}
                                      <div className="bg-surface rounded-3xl border border-gray-200 dark:border-gray-800 shadow-md p-5 md:p-6">
                                          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                                              <span className="w-1.5 h-6 bg-green-500 rounded-full"></span>
                                              <h3 className="text-lg font-bold text-green-500 font-heading">{t.quiz}</h3>
                                          </div>
                                          <QuizView 
                                            questions={activeLecture.quiz} 
                                            t={t} 
                                            onComplete={logActivity}
                                          />
                                      </div>
                                  </div>
                              </div>
                          </motion.div>
                      ) : dashboardSubView === 'upload' ? (
                          <motion.div 
                            key="upload-view"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.3 }}
                            className="min-h-screen bg-background flex flex-col"
                          >
                              <header className="bg-surface/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 px-4 md:px-6 py-3 flex justify-between items-center shadow-sm">
                                <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => setDashboardSubView(null)}>
                                    <Logo size="sm" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={toggleLanguage} className="p-2 text-gray-500 hover:text-primary rounded-full" title="Switch Language">
                                        <Globe className="w-5 h-5" />
                                    </button>
                                    <button onClick={toggleTheme} className="p-2 text-gray-500 hover:text-primary rounded-full" title="Toggle Theme">
                                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                    </button>
                                    <button onClick={() => setCurrentView('profile')} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-bold shadow-md ml-2">
                                        {user.name.charAt(0)}
                                    </button>
                                </div>
                              </header>

                              <div className="p-4 container mx-auto flex-1 flex flex-col">
                                  <button onClick={() => setDashboardSubView(null)} className="self-start flex items-center gap-2 text-gray-500 hover:text-primary mb-6 font-medium bg-surface/50 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-surface">
                                      <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t.back}
                                  </button>
                                  <div className="flex-1 flex items-center justify-center">
                                    <UploadSection 
                                        onFileSelect={handleFileUpload} 
                                        isProcessing={uploadState.isProcessing} 
                                        progressStep={uploadState.progress}
                                        t={t}
                                        onCancel={handleCancelUpload}
                                    />
                                  </div>
                              </div>
                          </motion.div>
                      ) : (
                          <motion.div 
                            key="main-dashboard"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                              <MainDashboard 
                                  user={user}
                                  stats={stats}
                                  savedLectures={lectures}
                                  workspaces={workspaces}
                                  activeWorkspaceId={activeWorkspaceId}
                                  generalNotes={generalNotes}
                                  todos={todos}
                                  onAddTodo={handleAddTodo}
                                  onToggleTodo={handleToggleTodo}
                                  onDeleteTodo={handleDeleteTodo}
                                  onUpdateTodo={handleUpdateTodo}
                                  onUpdateWorkspace={handleUpdateWorkspace}
                                  onSetActiveWorkspace={setActiveWorkspaceId}
                                  onCreateWorkspace={(name, color) => setWorkspaces(prev => [...prev, { id: Date.now().toString(), name, color }])}
                                  onDeleteWorkspace={(id) => {
                                      setLectures(prev => prev.filter(l => l.workspaceId !== id));
                                      setWorkspaces(prev => prev.filter(w => w.id !== id));
                                      if (activeWorkspaceId === id && workspaces.length > 1) {
                                          setActiveWorkspaceId(workspaces.find(w => w.id !== id)?.id || '');
                                      } else if (workspaces.length <= 1) {
                                          // Handle case where last workspace is deleted
                                          // Maybe create a default one or show an empty state
                                      }
                                  }}
                                  onStartLecture={() => setDashboardSubView('upload')}
                                  onOpenLecture={(lecture) => {
                                      setActiveLecture(lecture);
                                      setDashboardSubView('study');
                                  }}
                                  onOpenNotes={() => {}}
                                  onUpdateQuote={(quote) => setUser(prev => prev ? ({ ...prev, quote }) : null)}
                                  onAddGeneralNote={handleAddGeneralNote}
                                  onDeleteGeneralNote={(id) => setGeneralNotes(prev => prev.filter(n => n.id !== id))}
                                  t={t}
                                  lang={language}
                                  theme={theme}
                                  onToggleTheme={toggleTheme}
                                  onLogout={handleLogout}
                                  onToggleLanguage={toggleLanguage}
                                  onOpenProfile={() => setCurrentView('profile')}
                                  backgroundUpload={uploadState}
                                  onOpenUpload={() => setDashboardSubView('upload')}
                                  onActivity={logActivity}
                              />
                          </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
              );
      }
  };

  return renderContent();
}

export default App;