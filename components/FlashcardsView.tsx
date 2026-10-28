import React, { useState, useEffect, useCallback } from 'react';
import { Flashcard } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, Check, X, Repeat, Trophy, Sparkles, Brain, Clock } from 'lucide-react';

interface FlashcardsViewProps {
  cards: Flashcard[];
  t?: any;
  onSessionComplete?: () => void;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({ cards, t, onSessionComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(0);
  const [stats, setStats] = useState({ known: 0, review: 0, easy: 0, hard: 0 });
  const [isCompleted, setIsCompleted] = useState(false);
  const [cardStats, setCardStats] = useState<{ [key: number]: { interval: number; easeFactor: number; reps: number } }>({});

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setStats({ known: 0, review: 0, easy: 0, hard: 0 });
    setIsCompleted(false);
  }, [cards]);

  const handleSM2Review = useCallback((grade: 0 | 1 | 2 | 3) => {
    const current = cardStats[currentIndex] || { interval: 0, easeFactor: 2.5, reps: 0 };
    let { interval, easeFactor, reps } = current;

    // SM-2 calculation
    const diff = 3 - grade;
    easeFactor = Math.max(1.3, Number((easeFactor + (0.1 - diff * (0.08 + diff * 0.02))).toFixed(2)));

    if (grade < 2) {
      reps = 0;
      interval = grade === 1 ? 1 : 0;
    } else {
      if (reps === 0) interval = 1;
      else if (reps === 1) interval = 6;
      else interval = Math.max(1, Math.round(interval * easeFactor));

      if (grade === 3 && reps >= 1) {
        interval = Math.round(interval * 1.3);
      }
      reps += 1;
    }

    setCardStats(prev => ({
      ...prev,
      [currentIndex]: { interval, easeFactor, reps }
    }));

    if (grade >= 2) {
      setStats(prev => ({ ...prev, known: prev.known + 1, easy: grade === 3 ? prev.easy + 1 : prev.easy }));
      setDirection(1);
    } else {
      setStats(prev => ({ ...prev, review: prev.review + 1, hard: grade === 1 ? prev.hard + 1 : prev.hard }));
      setDirection(-1);
    }

    if (currentIndex < cards.length - 1) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
        setDirection(0);
      }, 250);
    } else {
      setIsCompleted(true);
      if (onSessionComplete) onSessionComplete();
    }
  }, [cardStats, currentIndex, cards.length, onSessionComplete]);

  // Keyboard navigation: Space to flip, 1-4 to grade
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompleted || !cards || cards.length === 0) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.key === '1') {
        handleSM2Review(0);
      } else if (e.key === '2') {
        handleSM2Review(1);
      } else if (e.key === '3') {
        handleSM2Review(2);
      } else if (e.key === '4') {
        handleSM2Review(3);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, isCompleted, cards, handleSM2Review]);

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setStats({ known: 0, review: 0, easy: 0, hard: 0 });
    setIsCompleted(false);
    setDirection(0);
  };

  if (!cards || cards.length === 0) {
    return <div className="text-center p-8 text-gray-500">No flashcards available.</div>;
  }

  if (isCompleted) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6 animate-fade-in">
        <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-6 relative">
          <Trophy className="w-12 h-12 text-yellow-500" />
          <div className="absolute inset-0 rounded-full border-4 border-yellow-500/20 animate-ping"></div>
        </div>
        <h2 className="text-3xl font-bold text-text mb-2">{t?.sessionComplete || "Session Complete!"}</h2>
        <p className="text-gray-500 mb-8 text-lg">
          You mastered {cards.length} cards using SuperMemo SM-2 Active Recall.
        </p>
        <div className="grid grid-cols-4 gap-4 max-w-md w-full mb-10">
          <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-xl border border-red-200 dark:border-red-900/30 text-center">
            <div className="text-2xl font-bold text-red-500">{stats.review - stats.hard}</div>
            <div className="text-xs text-gray-500 font-bold uppercase mt-1">Again</div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200 dark:border-amber-900/30 text-center">
            <div className="text-2xl font-bold text-amber-500">{stats.hard}</div>
            <div className="text-xs text-gray-500 font-bold uppercase mt-1">Hard</div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/30 text-center">
            <div className="text-2xl font-bold text-emerald-500">{stats.known - stats.easy}</div>
            <div className="text-xs text-gray-500 font-bold uppercase mt-1">Good</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-200 dark:border-blue-900/30 text-center">
            <div className="text-2xl font-bold text-blue-500">{stats.easy}</div>
            <div className="text-xs text-gray-500 font-bold uppercase mt-1">Easy</div>
          </div>
        </div>
        <button 
          onClick={handleRestart}
          className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <Repeat className="w-5 h-5" /> {t?.restartDeck || "Restart Deck"}
        </button>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex) / cards.length) * 100;
  const currentCardInfo = cardStats[currentIndex];

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto relative select-none">
      {/* Progress & Algorithm Stats */}
      <div className="mb-6">
        <div className="flex justify-between items-center text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
          <span className="flex items-center gap-1.5 text-primary">
            <Brain className="w-4 h-4" /> SuperMemo SM-2 Active Recall
          </span>
          <span>{currentIndex + 1} / {cards.length}</span>
        </div>
        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Card Area */}
      <div className="flex-1 relative perspective-1000 min-h-[320px] flex flex-col justify-center mb-6">
        <div className="relative w-full aspect-[1.6/1] group cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ 
                x: direction === 0 ? 0 : direction * 50, 
                opacity: 0,
                scale: 0.9 
              }}
              animate={{ 
                x: 0, 
                opacity: 1,
                scale: 1,
                rotateY: isFlipped ? 180 : 0
              }}
              exit={{ 
                x: direction * -50,
                opacity: 0,
                scale: 1.1
              }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              style={{ transformStyle: 'preserve-3d' }}
              className="w-full h-full absolute inset-0"
            >
              {/* Front */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-surface border border-gray-200 dark:border-gray-700 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 text-center hover:border-primary/50 transition-colors">
                <span className="absolute top-6 left-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Question</span>
                <h3 className="text-2xl md:text-3xl font-bold text-text leading-snug">
                  {currentCard.front}
                </h3>
                <div className="absolute bottom-6 text-gray-400 text-sm flex items-center gap-2 opacity-60">
                  <RotateCw className="w-4 h-4" /> {t?.tapToFlip || "Tap or Press Space to Flip"}
                </div>
              </div>

              {/* Back */}
              <div 
                className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-primary to-secondary text-white rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 text-center rotate-y-180"
              >
                <span className="absolute top-6 left-6 text-xs font-bold text-blue-200 uppercase tracking-wider">Answer</span>
                <p className="text-xl md:text-2xl font-medium leading-relaxed">
                  {currentCard.back}
                </p>
                {currentCardInfo && (
                  <div className="absolute bottom-4 text-blue-200/80 text-xs flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> Next Interval: {currentCardInfo.interval === 0 ? '10 mins' : `${currentCardInfo.interval} day(s)`} • EF: {currentCardInfo.easeFactor}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* SM-2 Recall Feedback Controls (Keyboard 1, 2, 3, 4) */}
      <div className="grid grid-cols-4 gap-3">
        <button 
          onClick={() => handleSM2Review(0)}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-surface border border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-all hover:scale-105 active:scale-95"
        >
          <span className="text-xs text-gray-400 font-mono mb-0.5">[1]</span>
          <span className="font-bold text-sm">Again</span>
          <span className="text-[10px] text-gray-400">&lt; 10m</span>
        </button>

        <button 
          onClick={() => handleSM2Review(1)}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-surface border border-amber-200 dark:border-amber-900/30 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500 transition-all hover:scale-105 active:scale-95"
        >
          <span className="text-xs text-gray-400 font-mono mb-0.5">[2]</span>
          <span className="font-bold text-sm">Hard</span>
          <span className="text-[10px] text-gray-400">1 day</span>
        </button>

        <button 
          onClick={() => handleSM2Review(2)}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-surface border border-emerald-200 dark:border-emerald-900/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-500 transition-all hover:scale-105 active:scale-95"
        >
          <span className="text-xs text-gray-400 font-mono mb-0.5">[3]</span>
          <span className="font-bold text-sm">Good</span>
          <span className="text-[10px] text-gray-400">Normal</span>
        </button>

        <button 
          onClick={() => handleSM2Review(3)}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-surface border border-blue-200 dark:border-blue-900/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-all hover:scale-105 active:scale-95"
        >
          <span className="text-xs text-gray-400 font-mono mb-0.5">[4]</span>
          <span className="font-bold text-sm">Easy</span>
          <span className="text-[10px] text-gray-400">Bonus</span>
        </button>
      </div>
    </div>
  );
};
