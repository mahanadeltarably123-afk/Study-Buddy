import React, { useState } from 'react';
import { AuthMode, Language } from '../types';
import { ArrowLeft, UserCircle, AlertCircle, Loader2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';

interface AuthProps {
    initialMode: AuthMode;
    onComplete: (user?: any, token?: string, isGuest?: boolean) => void;
    onBack: () => void;
    t: any;
    lang: Language;
}

export const Auth: React.FC<AuthProps> = ({ initialMode, onComplete, onBack, t, lang }) => {
    const [error, setError] = useState<string | null>(null);
    const { login } = useAuth();

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            if (credentialResponse.credential) {
                // Send token to backend to verify and get user session
                const res = await fetch('http://localhost:8000/auth/login', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${credentialResponse.credential}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    login(credentialResponse.credential); // Store token in context
                    onComplete(data.user, credentialResponse.credential, false);
                } else {
                    setError("Failed to verify with backend");
                }
            }
        } catch (err) {
            console.error(err);
            setError("Google Sign-In failed");
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
                            {t.welcomeBack}
                        </h2>
                        <p className="text-gray-500 text-sm">
                            Sign in to access your workspace and save your progress.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 rounded-lg flex items-center gap-2 text-sm bg-red-500/10 text-red-500 border border-red-500/20">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-4 items-center w-full">
                        <div className="w-full flex justify-center">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setError("Login Failed")}
                                theme="filled_blue"
                                shape="pill"
                                size="large"
                                width="100%"
                            />
                        </div>

                        <div className="relative w-full py-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-200 dark:border-gray-700" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-surface px-2 text-gray-500">Or</span>
                            </div>
                        </div>

                        <button
                            onClick={() => onComplete(null, undefined, true)}
                            className="w-full bg-transparent border border-gray-300 dark:border-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-text font-medium py-3 rounded-xl transition-all flex justify-center items-center gap-2"
                        >
                            <UserCircle className="w-5 h-5" />
                            {t.continueGuest}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};