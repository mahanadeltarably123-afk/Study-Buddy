import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, Zap, CheckCircle2, Volume2, Timer } from 'lucide-react';

interface PomodoroViewProps {
  onSessionComplete?: (minutes: number, mode: string) => void;
  t?: any;
}

export const PomodoroView: React.FC<PomodoroViewProps> = ({ onSessionComplete, t }) => {
  const [mode, setMode] = useState<'work' | 'short_break' | 'long_break'>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  const MODE_TIMES = {
    work: 25 * 60,
    short_break: 5 * 60,
    long_break: 15 * 60
  };

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      // Play soft chime notification if audio context available
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } catch (e) {
        // AudioContext not allowed or not supported
      }

      if (mode === 'work') {
        const newCount = completedSessions + 1;
        setCompletedSessions(newCount);
        if (onSessionComplete) onSessionComplete(25, 'work');
        // Switch to long break after 4 sessions, otherwise short break
        const nextMode = newCount % 4 === 0 ? 'long_break' : 'short_break';
        setMode(nextMode);
        setTimeLeft(MODE_TIMES[nextMode]);
      } else {
        setMode('work');
        setTimeLeft(MODE_TIMES.work);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, completedSessions, onSessionComplete]);

  const switchMode = (newMode: 'work' | 'short_break' | 'long_break') => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(MODE_TIMES[newMode]);
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(MODE_TIMES[mode]);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const totalTime = MODE_TIMES[mode];
  const progressPercent = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="max-w-md mx-auto flex flex-col items-center justify-center p-6 bg-surface border border-gray-200 dark:border-gray-800 rounded-3xl shadow-xl animate-fade-in">
      {/* Mode Buttons */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-2xl mb-8">
        <button
          onClick={() => switchMode('work')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            mode === 'work' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-text'
          }`}
        >
          <Zap className="w-3.5 h-3.5" /> Focus (25m)
        </button>
        <button
          onClick={() => switchMode('short_break')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            mode === 'short_break' ? 'bg-emerald-500 text-white shadow-md' : 'text-gray-500 hover:text-text'
          }`}
        >
          <Coffee className="w-3.5 h-3.5" /> Short (5m)
        </button>
        <button
          onClick={() => switchMode('long_break')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            mode === 'long_break' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-500 hover:text-text'
          }`}
        >
          <Timer className="w-3.5 h-3.5" /> Long (15m)
        </button>
      </div>

      {/* Circular Progress Display */}
      <div className="relative w-64 h-64 flex items-center justify-center mb-8">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="110"
            stroke="currentColor"
            strokeWidth="12"
            className="text-gray-100 dark:text-gray-800"
            fill="transparent"
          />
          <circle
            cx="128"
            cy="128"
            r="110"
            stroke="currentColor"
            strokeWidth="12"
            strokeDasharray={2 * Math.PI * 110}
            strokeDashoffset={2 * Math.PI * 110 * (1 - progressPercent / 100)}
            strokeLinecap="round"
            className={`transition-all duration-500 ${
              mode === 'work' ? 'text-primary' : mode === 'short_break' ? 'text-emerald-500' : 'text-indigo-500'
            }`}
            fill="transparent"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-5xl font-mono font-bold text-text tracking-tighter">{formattedTime}</span>
          <span className="text-xs uppercase tracking-widest text-gray-400 font-bold mt-2">
            {mode === 'work' ? 'Deep Study Session' : 'Rest & Recharge'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={resetTimer}
          className="p-3.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-text transition-all hover:scale-105 active:scale-95"
          title="Reset Timer"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={toggleTimer}
          className={`px-8 py-3.5 rounded-2xl text-white font-bold text-lg shadow-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 ${
            mode === 'work' ? 'bg-primary hover:bg-blue-600' : mode === 'short_break' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-indigo-500 hover:bg-indigo-600'
          }`}
        >
          {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
          <span>{isActive ? 'Pause' : 'Start Focus'}</span>
        </button>
      </div>

      {/* Sessions Completed Badge */}
      <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        <span>Completed Focus Sessions: <strong className="text-text">{completedSessions}</strong></span>
      </div>
    </div>
  );
};
