import React, { useState } from 'react';
import { AuthMode, Language } from '../types';
import { ArrowLeft, Mail, Lock, User, UserCircle, AlertCircle, Loader2 } from 'lucide-react';
import { authService } from '../services/authService';
import { Logo } from './Logo';

interface AuthProps {
  initialMode: AuthMode;
  onComplete: (user?: any, token?: string, isGuest?: boolean) => void;
  onBack: () => void;
  t: any;
  lang: Language;
}

export const Auth: React.FC<AuthProps> = ({ initialMode, onComplete, onBack, t, lang }) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) throw new Error("Passwords do not match");
        await authService.register(name, email, password);
        setMode('login');
        setError("Account created! Please sign in.");
        setLoading(false);
      } else {
        const { user, token } = await authService.login(email, password);
        onComplete(user, token, false);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/20 opacity-50 dark:opacity-20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-secondary/20 opacity-40 dark:opacity-10 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-[450px] relative z-10">
        <button onClick={onBack} className="absolute -top-12 left-0 text-gray-500 hover:text-text flex items-center gap-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-surface border border-gray-200 dark:border-gray-800 p-8 md:p-10 rounded-3xl shadow-2xl">
            <div className="flex flex-col items-center text-center mb-8">
                <Logo size="lg" className="mb-6" />
                <h2 className="text-2xl font-bold text-text mb-2">
                    {mode === 'login' ? t.welcomeBack : t.createAccount}
                </h2>
                <p className="text-gray-500 text-sm">
                    {mode === 'login' ? 'Enter your credentials to access your workspace.' : 'Start your learning journey today.'}
                </p>
            </div>

            {error && (
                <div className={`mb-6 p-3 rounded-lg flex items-center gap-2 text-sm ${error.includes('created') ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text" 
                            placeholder={t.fullName}
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-background border border-gray-300 dark:border-gray-700 rounded-xl py-3 pl-12 pr-4 text-text placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        />
                    </div>
                )}
                
                <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                    <input 
                        type="email" 
                        placeholder={t.email}
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-background border border-gray-300 dark:border-gray-700 rounded-xl py-3 pl-12 pr-4 text-text placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                </div>

                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                    <input 
                        type="password" 
                        placeholder={t.password}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-background border border-gray-300 dark:border-gray-700 rounded-xl py-3 pl-12 pr-4 text-text placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                </div>

                {mode === 'signup' && (
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                        <input 
                            type="password" 
                            placeholder={t.confirmPassword}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-background border border-gray-300 dark:border-gray-700 rounded-xl py-3 pl-12 pr-4 text-text placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        />
                    </div>
                )}

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-2"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        mode === 'login' ? t.signIn : t.createAccount
                    )}
                </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 space-y-4">
                <button 
                    onClick={() => onComplete(null, undefined, true)}
                    className="w-full bg-transparent border border-gray-300 dark:border-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-text font-medium py-3 rounded-xl transition-all flex justify-center items-center gap-2"
                >
                    <UserCircle className="w-5 h-5" />
                    {t.continueGuest}
                </button>

                <p className="text-center text-gray-500 text-sm">
                    {mode === 'login' ? t.dontHaveAccount : t.alreadyHaveAccount}
                    <button 
                        onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
                        className="text-primary hover:text-blue-400 font-bold ml-2 transition-colors"
                    >
                        {mode === 'login' ? t.signup : t.login}
                    </button>
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};