
import React, { useState, useEffect } from 'react';
import { Flashcard } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, Check, X, Repeat, Trophy } from 'lucide-react';

interface FlashcardsViewProps {
  cards: Flashcard[];
  t?: any;
  onSessionComplete?: () => void;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({ cards, t, onSessionComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const [stats, setStats] = useState({ known: 0, review: 0 });
  const [isCompleted, setIsCompleted] = useState(false);

  // Reset when cards change
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setStats({ known: 0, review: 0 });
    setIsCompleted(false);
  }, [cards]);

  const handleNext = (status: 'known' | 'review') => {
    setStats(prev => ({
      ...prev,
      [status]: prev[status] + 1
    }));
    
    setDirection(status === 'known' ? 1 : -1);
    
    if (currentIndex < cards.length - 1) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
        setDirection(0);
      }, 300);
    } else {
      setIsCompleted(true);
      if (onSessionComplete) onSessionComplete();
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setStats({ known: 0, review: 0 });
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
           You reviewed {cards.length} cards.
        </p>
        <div className="flex gap-8 mb-10">
            <div className="text-center">
                <div className="text-3xl font-bold text-green-500">{stats.known}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">{t?.knowIt || "Known"}</div>
            </div>
            <div className="text-center">
                <div className="text-3xl font-bold text-orange-500">{stats.review}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">{t?.reviewLater || "Review"}</div>
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

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto relative">
      {/* Progress Bar */}
      <div className="mb-6">
         <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
             <span>{t?.progress || "Progress"}</span>
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
                        opacity: direction === 0 ? 0 : 0,
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
                    <div className="absolute inset-0 w-full h-full backface-hidden bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 text-center hover:border-primary/50 transition-colors">
                        <span className="absolute top-6 left-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Question</span>
                        <h3 className="text-2xl md:text-3xl font-bold text-text leading-snug">
                            {currentCard.front}
                        </h3>
                        <div className="absolute bottom-6 text-gray-400 text-sm flex items-center gap-2 opacity-50">
                            <RotateCw className="w-4 h-4" /> {t?.tapToFlip || "Tap to Flip"}
                        </div>
                    </div>

                    {/* Back */}
                    <div 
                        className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-primary to-blue-600 text-white rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 text-center rotate-y-180"
                    >
                         <span className="absolute top-6 left-6 text-xs font-bold text-blue-200 uppercase tracking-wider">Answer</span>
                         <p className="text-xl md:text-2xl font-medium leading-relaxed">
                            {currentCard.back}
                         </p>
                    </div>
                </motion.div>
            </AnimatePresence>
         </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-6">
          <button 
             onClick={() => handleNext('review')}
             className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-surface border border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-all hover:scale-105 active:scale-95 group"
          >
              <X className="w-6 h-6 group-hover:scale-125 transition-transform" />
              <span className="font-bold">{t?.reviewLater || "Review Later"}</span>
          </button>

          <button 
             onClick={() => handleNext('known')}
             className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-surface border border-green-200 dark:border-green-900/30 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-500 transition-all hover:scale-105 active:scale-95 group"
          >
              <Check className="w-6 h-6 group-hover:scale-125 transition-transform" />
              <span className="font-bold">{t?.knowIt || "Know It"}</span>
          </button>
      </div>
    </div>
  );
};
