
import React, { useState, useEffect } from 'react';
import { ArrowRight, Mic, Zap, Brain, Globe, CheckCircle2, Play, Layers, Moon, Sun, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { Logo } from './Logo';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onGuest: () => void;
  t: any;
  lang: Language;
  onToggleLanguage: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onGuest, t, lang, onToggleLanguage, theme, onToggleTheme }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-text font-sans overflow-x-hidden selection:bg-primary selection:text-white transition-colors duration-300">
      
      {/* Navigation Bar */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-background/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 py-3' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
          <Logo size="md" />

          <div className="flex items-center gap-2 md:gap-4">
            <button 
                onClick={onToggleTheme}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button 
                onClick={onToggleLanguage}
                className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
            >
                <Globe className="w-4 h-4" />
                <span>{lang === 'en' ? 'EN' : 'AR'}</span>
            </button>

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-800 hidden md:block"></div>
            
            <button 
                onClick={onLogin}
                className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-primary transition-colors hidden sm:block"
            >
                {t.login}
            </button>
            <button 
                onClick={onGetStarted}
                className="bg-primary hover:bg-blue-600 text-white text-xs md:text-sm font-bold px-4 py-2 md:px-5 md:py-2.5 rounded-full transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 whitespace-nowrap"
            >
                {t.getStarted}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 md:pt-52 md:pb-32 px-6 overflow-hidden">
        {/* Background Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary opacity-10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-secondary opacity-5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 animate-fade-in">
             <Sparkles className="w-4 h-4" /> {t.slogan || "Use your time and effort wisely"}
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] mb-8 font-heading text-text">
            {lang === 'ar' ? 'تعلم بذكاء لا بجهد' : 'Learn Smart Not Hard'}
          </h1>
          
          <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed px-4">
            {t.heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in w-full px-6">
              <button 
                onClick={onGetStarted}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-primary hover:bg-blue-600 text-white text-lg font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                {t.getStarted} <ArrowRight className="w-5 h-5 rtl:rotate-180" />
              </button>
              <button 
                onClick={onGuest}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-surface border border-gray-200 dark:border-gray-800 text-text font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" /> {t.tryGuest}
              </button>
          </div>
          
          <div className="pt-8 border-t border-gray-200 dark:border-white/5 flex flex-wrap justify-center gap-6 md:gap-16 text-gray-500 text-sm md:text-base">
             <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="font-medium">99% Accuracy</span>
             </div>
             <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="font-medium">Instant Processing</span>
             </div>
             <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="font-medium">Multi-language</span>
             </div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="py-20 px-4 md:px-6 relative bg-gray-50/50 dark:bg-[#0A1124]/50">
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold font-heading mb-4 text-text">
                   {lang === 'ar' ? 'كل ما تحتاجه ' : 'Everything you need to '} 
                   <span className="text-primary">{lang === 'ar' ? 'للتفوق.' : 'Ace It.'}</span>
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto">
                   {t.heroSubtitle}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-surface border border-gray-200 dark:border-white/5 rounded-3xl p-8 md:p-12 relative overflow-hidden group hover:border-primary/30 transition-colors shadow-sm">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-5 blur-3xl rounded-full group-hover:opacity-10 transition-opacity"></div>
                    <div className="relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                            <Mic className="w-7 h-7" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-text">{t.captureLecture}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed max-w-md">
                            Upload audio or video files. Our AI transcribes, diarizes, and understands the context of your lecture to extract what truly matters.
                        </p>
                    </div>
                </div>

                <div className="md:row-span-2 bg-surface border border-gray-200 dark:border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-primary/30 transition-colors flex flex-col shadow-sm">
                    <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6 text-secondary">
                        <Brain className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-text">{lang === 'ar' ? 'تحدث مع رفيق' : 'Chat with Buddy'}</h3>
                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
                        Don't just read summaries. Chat with your study materials. Ask specific questions and get cited answers from your lecture content.
                    </p>
                    <div className="mt-auto bg-background rounded-xl p-4 border border-gray-200 dark:border-white/5">
                        <div className="flex gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">SB</div>
                            <div className="bg-gray-200 dark:bg-[#1e293b] rounded-lg rounded-tl-none p-3 text-xs text-gray-600 dark:text-gray-300">
                                Based on the lecture, the key difference is...
                            </div>
                        </div>
                        <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full w-2/3 bg-primary"></div>
                        </div>
                    </div>
                </div>

                <div className="bg-surface border border-gray-200 dark:border-white/5 rounded-3xl p-8 group hover:border-primary/30 transition-colors shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-500">
                        <Zap className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-text">{t.quiz}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Auto-generated multiple choice and true/false questions to test your knowledge.</p>
                </div>

                <div className="bg-surface border border-gray-200 dark:border-white/5 rounded-3xl p-8 group hover:border-primary/30 transition-colors shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 text-orange-500">
                        <Layers className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-text">{t.flashcards}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Spaced repetition ready flashcards created from key concepts and definitions.</p>
                </div>
            </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#02040a] py-12 px-6 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <Logo size="sm" />
            
            <div className="flex gap-8 text-sm text-gray-500">
                <a href="#" className="hover:text-primary transition-colors">Privacy</a>
                <a href="#" className="hover:text-primary transition-colors">Terms</a>
                <a href="#" className="hover:text-primary transition-colors">Contact</a>
            </div>

            <div className="text-gray-500 text-sm">
                © 2024 StudyBuddy AI. All rights reserved.
            </div>
        </div>
      </footer>
    </div>
  );
};
