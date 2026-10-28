import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { GoogleOAuthProvider, googleLogout, useGoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

interface User {
    id: number;
    name: string;
    email: string;
    picture: string;
    isGuest: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
    const [isLoading, setIsLoading] = useState(true);

    const logout = useCallback(() => {
        googleLogout();
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
    }, []);

    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    const response = await fetch('http://localhost:8000/users/me', {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    if (response.ok) {
                        const userData = await response.json();
                        setUser(userData);
                    } else {
                        logout();
                    }
                } catch (error) {
                    console.error("Failed to fetch user", error);
                    logout();
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, [token, logout]);

    const login = (newToken: string) => {
        localStorage.setItem('auth_token', newToken);
        setToken(newToken);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
