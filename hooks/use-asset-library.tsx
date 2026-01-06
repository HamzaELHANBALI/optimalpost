'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Session } from '@/lib/types';
import { useAuth } from './use-auth';

interface AssetLibraryContextType {
    sessions: Session[];
    currentSession: Session | null;
    loading: boolean;
    addSession: (session: Omit<Session, 'id' | 'timestamp'>) => Promise<void>;
    deleteSession: (id: string) => Promise<void>;
    loadSession: (id: string) => void;
    clearCurrentSession: () => void;
}

const AssetLibraryContext = createContext<AssetLibraryContextType | undefined>(undefined);

const STORAGE_KEY = 'optimalpost-sessions';

// Helper to convert API response to Session
function rowToSession(row: any): Session {
    return {
        id: row.id,
        timestamp: typeof row.timestamp === 'string' ? parseInt(row.timestamp, 10) : Number(row.timestamp),
        originalInput: row.originalInput,
        inputType: row.inputType,
        analysis: row.analysis,
        sameTopicVariations: row.sameTopicVariations,
        adjacentTopicVariations: row.adjacentTopicVariations,
    };
}

export function AssetLibraryProvider({ children }: { children: ReactNode }) {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [currentSession, setCurrentSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // Load sessions from API when user is authenticated, otherwise from localStorage
    useEffect(() => {
        const loadSessions = async () => {
            setLoading(true);

            if (user) {
                // Load from API
                try {
                    const response = await fetch('/api/sessions');
                    if (response.ok) {
                        const data = await response.json();
                        setSessions(data.map(rowToSession));
                    } else {
                        console.error('Failed to load sessions:', response.statusText);
                        loadFromLocalStorage();
                    }
                } catch (err) {
                    console.error('Error loading sessions:', err);
                    loadFromLocalStorage();
                }
            } else {
                // Load from localStorage when not authenticated
                loadFromLocalStorage();
            }

            setLoading(false);
        };

        const loadFromLocalStorage = () => {
            if (typeof window !== 'undefined') {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        setSessions(parsed);
                    } catch (e) {
                        console.error('Failed to parse stored sessions:', e);
                        setSessions([]);
                    }
                } else {
                    setSessions([]);
                }
            }
        };

        loadSessions();
    }, [user]);

    const addSession = useCallback(async (sessionData: Omit<Session, 'id' | 'timestamp'>) => {
        const newSession: Session = {
            ...sessionData,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
        };

        // Optimistically update UI
        setSessions(prev => {
            const updated = [newSession, ...prev];
            if (!user) {
                // Save to localStorage when not authenticated
                saveToLocalStorage(updated);
            }
            return updated;
        });
        setCurrentSession(newSession);

        if (user) {
            // Save to API
            try {
                const response = await fetch('/api/sessions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(sessionData),
                });

                if (!response.ok) {
                    console.error('Failed to save session:', response.statusText);
                    // Keep in localStorage as backup
                    setSessions(prev => {
                        saveToLocalStorage(prev);
                        return prev;
                    });
                } else {
                    // Update with server-generated ID
                    const savedSession = await response.json();
                    setSessions(prev => {
                        const updated = prev.map(s =>
                            s.id === newSession.id ? rowToSession(savedSession) : s
                        );
                        return updated;
                    });
                    setCurrentSession(rowToSession(savedSession));
                }
            } catch (err) {
                console.error('Error saving session:', err);
                setSessions(prev => {
                    saveToLocalStorage(prev);
                    return prev;
                });
            }
        }
    }, [user]);

    const deleteSession = useCallback(async (id: string) => {
        // Optimistically update UI
        setSessions(prev => prev.filter(s => s.id !== id));
        if (currentSession?.id === id) {
            setCurrentSession(null);
        }

        if (user) {
            // Delete from API
            try {
                const response = await fetch(`/api/sessions?id=${id}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    console.error('Failed to delete session:', response.statusText);
                    // Reload sessions to restore state
                    const reloadResponse = await fetch('/api/sessions');
                    if (reloadResponse.ok) {
                        const data = await reloadResponse.json();
                        setSessions(data.map(rowToSession));
                    }
                }
            } catch (err) {
                console.error('Error deleting session:', err);
            }
        } else {
            // Update localStorage when not authenticated
            setSessions(prev => {
                const updated = prev.filter(s => s.id !== id);
                saveToLocalStorage(updated);
                return updated;
            });
        }
    }, [user, currentSession]);

    const loadSession = useCallback((id: string) => {
        const session = sessions.find(s => s.id === id);
        if (session) {
            setCurrentSession(session);
        }
    }, [sessions]);

    const clearCurrentSession = useCallback(() => {
        setCurrentSession(null);
    }, []);

    const saveToLocalStorage = (sessionsToSave: Session[]) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionsToSave));
        }
    };

    return (
        <AssetLibraryContext.Provider
            value={{
                sessions,
                currentSession,
                loading,
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
