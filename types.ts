
export interface Flashcard {
  front: string;
  back: string;
  status?: 'known' | 'review' | 'unknown';
}

export type QuestionType = 'multiple-choice' | 'true-false';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Note {
  id: string;
  content: string;
  timestamp: number;
}

export interface LectureMetadata {
  title: string;
  subject: string;
  tags: string[];
  date: number;
}

export interface TranscriptSegment {
  timestamp: string;
  text: string;
  isKeyPoint?: boolean;
}

export interface StudyContent {
  metadata: LectureMetadata;
  summary: string;
  transcript?: string | TranscriptSegment[]; // Updated to support structured transcript
  keyPoints: string[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  notes?: Note[]; // New field for isolated notes per lecture
  mindMap?: string; // Mermaid JS syntax string
}

export interface SavedLecture extends StudyContent {
  id: string;
  workspaceId: string;
  isTranslated?: boolean;
  originalContent?: StudyContent;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export type AppView = 'landing' | 'auth' | 'dashboard' | 'lecture-capture' | 'processing' | 'study-session' | 'profile';
export type DashboardTab = 'summary' | 'quiz' | 'flashcards' | 'chat' | 'notes' | 'mindmap';
export type AuthMode = 'login' | 'signup';
export type Language = 'en' | 'ar';

export interface UserStats {
  studyHours: number;
  completedLectures: number;
  activeFlashcards: number;
  streakDays: number;
  activityLog: number[]; // Array of timestamps for activity heatmap
}

export interface UserProfile {
  name: string;
  email: string;
  isGuest: boolean;
  quote?: string; // New field for user quote
}

export interface Workspace {
  id: string;
  name: string;
  color?: string; // Changed from icon to color
  mainDeadline?: number;
  mainDeadlineLabel?: string;
}

export interface Todo {
  id: string;
  text: string;
  isCompleted: boolean;
  createdAt: number;
  importance: 'low' | 'medium' | 'high';
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  deadline?: number; // Replaced timer with an optional deadline timestamp
}
