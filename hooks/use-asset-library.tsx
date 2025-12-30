'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Session, ContentAnalysis, SameTopicVariation, NewTopicVariation } from '@/lib/types';

interface AssetLibraryContextType {
    sessions: Session[];
    currentSession: Session | null;
    addSession: (session: Omit<Session, 'id' | 'timestamp'>) => void;
    deleteSession: (id: string) => void;
    loadSession: (id: string) => void;
    clearCurrentSession: () => void;
}

const AssetLibraryContext = createContext<AssetLibraryContextType | undefined>(undefined);

const STORAGE_KEY = 'optimalpost-sessions';

export function AssetLibraryProvider({ children }: { children: ReactNode }) {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [currentSession, setCurrentSession] = useState<Session | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load sessions from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    setSessions(parsed);
                } catch (e) {
                    console.error('Failed to parse stored sessions:', e);
                }
            }
            setIsLoaded(true);
        }
    }, []);

    // Save sessions to localStorage whenever they change
    useEffect(() => {
        if (isLoaded && typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
        }
    }, [sessions, isLoaded]);

    const addSession = useCallback((sessionData: Omit<Session, 'id' | 'timestamp'>) => {
        const newSession: Session = {
            ...sessionData,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
        };
        setSessions(prev => [newSession, ...prev]);
        setCurrentSession(newSession);
    }, []);

    const deleteSession = useCallback((id: string) => {
        setSessions(prev => prev.filter(s => s.id !== id));
        if (currentSession?.id === id) {
            setCurrentSession(null);
        }
    }, [currentSession]);

    const loadSession = useCallback((id: string) => {
        const session = sessions.find(s => s.id === id);
        if (session) {
            setCurrentSession(session);
        }
    }, [sessions]);

    const clearCurrentSession = useCallback(() => {
        setCurrentSession(null);
    }, []);

    return (
        <AssetLibraryContext.Provider
            value={{
                sessions,
                currentSession,
                addSession,
                deleteSession,
                loadSession,
                clearCurrentSession,
            }}
        >
            {children}
        </AssetLibraryContext.Provider>
    );
}

export function useAssetLibrary() {
    const context = useContext(AssetLibraryContext);
    if (context === undefined) {
        throw new Error('useAssetLibrary must be used within an AssetLibraryProvider');
    }
    return context;
}
