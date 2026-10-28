
import React, { useState } from 'react';
import { QuizQuestion } from '../types';
import { CheckCircle, XCircle, AlertCircle, ArrowRight, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

interface QuizViewProps {
  questions: QuizQuestion[];
  t?: any;
  onComplete?: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ questions, t, onComplete }) => {
  // Track selected answer and answered state per question index
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: number}>({});
  const [questionStatus, setQuestionStatus] = useState<{[key: number]: 'correct' | 'incorrect'}>({});

  const handleOptionClick = (qIndex: number, oIndex: number) => {
    // Prevent changing answer after selection (Immediate feedback mode)
    if (selectedAnswers.hasOwnProperty(qIndex)) return;

    const isCorrect = questions[qIndex].correctAnswerIndex === oIndex;
    
    setSelectedAnswers(prev => {
        const newState = { ...prev, [qIndex]: oIndex };
        // Check if quiz is complete
        if (Object.keys(newState).length === questions.length && onComplete) {
            onComplete();
        }
        return newState;
    });
    setQuestionStatus(prev => ({ ...prev, [qIndex]: isCorrect ? 'correct' : 'incorrect' }));
  };

  const score = Object.values(questionStatus).filter(s => s === 'correct').length;
  const totalAnswered = Object.keys(questionStatus).length;

  return (
    <div className="w-full">
      {/* Progress Header */}
      <div className="mb-6 flex items-center justify-between bg-surface border-b border-gray-100 dark:border-gray-800 pb-4">
         <div>
            <h3 className="font-bold text-gray-500 uppercase text-xs tracking-wider">Your Score</h3>
            <p className="text-2xl font-bold text-primary font-heading">{score} <span className="text-gray-400 text-lg">/ {questions.length}</span></p>
         </div>
         <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                    className="text-gray-200 dark:text-gray-700"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                />
                <path
                    className="text-primary transition-all duration-1000"
                    strokeDasharray={`${(score / questions.length) * 100}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                />
            </svg>
            <Trophy className="w-5 h-5 text-yellow-500 absolute" />
         </div>
      </div>

      <div className="space-y-8">
        {questions.map((q, qIdx) => {
          const isAnswered = selectedAnswers.hasOwnProperty(qIdx);
          const selectedOption = selectedAnswers[qIdx];
          const status = questionStatus[qIdx];

          return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: qIdx * 0.1 }}
                key={q.id || qIdx} 
                className={`rounded-2xl transition-all duration-500 p-1 ${
                    isAnswered 
                        ? status === 'correct' ? 'bg-gradient-to-br from-green-500/20 to-transparent' : 'bg-gradient-to-br from-red-500/20 to-transparent'
                        : 'bg-transparent'
            }`}>
              <div className="p-4">
                <div className="flex gap-4 mb-4">
                    <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all shadow-md ${
                        isAnswered 
                            ? status === 'correct' ? 'bg-green-500 text-white scale-110' : 'bg-red-500 text-white scale-110'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                    }`}>
                        {isAnswered ? (status === 'correct' ? <CheckCircle className="w-5 h-5"/> : <XCircle className="w-5 h-5"/>) : qIdx + 1}
                    </span>
                    <div>
                        <span className="text-[10px] font-bold px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 uppercase tracking-wider mb-2 inline-block">
                            {q.type === 'true-false' ? (t?.trueFalse || 'True / False') : (t?.multipleChoice || 'Multiple Choice')}
                        </span>
                        <h3 className="text-base font-semibold text-text leading-relaxed">{q.question}</h3>
                    </div>
                </div>

                <div className={`space-y-2 ml-12 ${q.type === 'true-false' ? 'grid grid-cols-2 gap-3 space-y-0' : ''}`}>
                    {q.options.map((option, oIdx) => {
                    const isSelected = selectedOption === oIdx;
                    const isCorrectOption = q.correctAnswerIndex === oIdx;
                    
                    let buttonStyle = "w-full p-3 rounded-xl border text-left transition-all duration-200 flex items-center justify-between group relative overflow-hidden text-sm text-text ";
                    
                    if (isAnswered) {
                        if (isCorrectOption) {
                            buttonStyle += "bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/20 font-bold transform scale-[1.02] ";
                        } else if (isSelected && !isCorrectOption) {
                            buttonStyle += "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20 opacity-50 ";
                        } else {
                            buttonStyle += "bg-surface border-gray-200 dark:border-gray-800 opacity-40 cursor-not-allowed ";
                        }
                    } else {
                        buttonStyle += "bg-surface border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-primary hover:shadow-md cursor-pointer ";
                    }

                    return (
                        <button
                        key={oIdx}
                        onClick={() => handleOptionClick(qIdx, oIdx)}
                        disabled={isAnswered}
                        className={buttonStyle}
                        >
                        <span className="relative z-10">{option}</span>
                        {isAnswered && isCorrectOption && <CheckCircle className="w-4 h-4 text-white relative z-10" />}
                        {isAnswered && isSelected && !isCorrectOption && <XCircle className="w-4 h-4 text-white relative z-10" />}
                        </button>
                    );
                    })}
                </div>

                {/* Immediate Explanation Feedback */}
                {isAnswered && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="ml-12 mt-4 overflow-hidden"
                    >
                        <div className={`p-4 rounded-xl text-sm leading-relaxed border ${
                             status === 'correct' 
                             ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30 text-green-800 dark:text-green-200' 
                             : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30 text-blue-800 dark:text-blue-200'
                        }`}>
                            <div className="flex items-center gap-2 mb-1 font-bold">
                                <AlertCircle className="w-4 h-4" />
                                <span>Explanation</span>
                            </div>
                            {q.explanation}
                        </div>
                    </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {totalAnswered === questions.length && (
          <div className="mt-12 text-center p-6 bg-surface rounded-3xl border border-gray-200 dark:border-gray-800">
             <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-yellow-500 animate-bounce" />
             </div>
             <h4 className="text-2xl font-bold text-text mb-2">{t?.quizComplete || "Quiz Complete!"}</h4>
             <p className="text-gray-500 mb-6">You mastered {Math.round((score / questions.length) * 100)}% of this concept.</p>
             <button 
                onClick={() => {
                    setSelectedAnswers({});
                    setQuestionStatus({});
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-primary hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/30 transition-all hover:scale-105"
             >
                {t?.retakeQuiz || "Retake Quiz"}
             </button>
          </div>
      )}
    </div>
  );
};
