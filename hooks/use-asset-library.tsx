'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Session } from '@/lib/types';
import { useAuth } from './use-auth';
import { createClient } from '@/lib/supabase/client';

interface AssetLibraryContextType {
    sessions: Session[];
    currentSession: Session | null;
    loading: boolean;
    addSession: (session: Omit<Session, 'id' | 'timestamp'>) => Promise<void>;
    deleteSession: (id: string) => Promise<void>;
    loadSession: (id: string) => void;
    clearCurrentSession: () => void;
    migrateFromLocalStorage: () => Promise<void>;
}

const AssetLibraryContext = createContext<AssetLibraryContextType | undefined>(undefined);

const STORAGE_KEY = 'provenpost-sessions';

// Helper to convert Supabase row to Session
function rowToSession(row: any): Session {
    return {
        id: row.id,
        timestamp: row.timestamp,
        originalInput: row.original_input,
        inputType: row.input_type,
        analysis: row.analysis,
        sameTopicVariations: row.same_topic_variations,
        adjacentTopicVariations: row.adjacent_topic_variations,
    };
}

// Helper to convert Session to Supabase row
function sessionToRow(session: Omit<Session, 'id' | 'timestamp'> & { id?: string; timestamp?: number }) {
    return {
        id: session.id,
        timestamp: session.timestamp ?? Date.now(),
        original_input: session.originalInput,
        input_type: session.inputType,
        analysis: session.analysis,
        same_topic_variations: session.sameTopicVariations,
        adjacent_topic_variations: session.adjacentTopicVariations,
    };
}

export function AssetLibraryProvider({ children }: { children: ReactNode }) {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [currentSession, setCurrentSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const supabase = createClient();

    // Load sessions from Supabase when user is authenticated, otherwise from localStorage
    useEffect(() => {
        const loadSessions = async () => {
            setLoading(true);

            if (user) {
                // Load from Supabase
                try {
                    const { data, error } = await supabase
                        .from('sessions')
                        .select('*')
                        .order('timestamp', { ascending: false });

                    if (error) {
                        console.error('Failed to load sessions:', error);
                        // Fallback to localStorage on error
                        loadFromLocalStorage();
                    } else {
                        setSessions(data ? data.map(rowToSession) : []);
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
    }, [user, supabase]);

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
            // Save to Supabase
            try {
                const { error } = await supabase
                    .from('sessions')
                    .insert({
                        id: newSession.id,
                        user_id: user.id,
                        timestamp: newSession.timestamp,
                        original_input: newSession.originalInput,
                        input_type: newSession.inputType,
                        analysis: newSession.analysis,
                        same_topic_variations: newSession.sameTopicVariations,
                        adjacent_topic_variations: newSession.adjacentTopicVariations,
                    });

                if (error) {
                    console.error('Failed to save session to Supabase:', error);
                    // Keep in localStorage as backup
                    setSessions(prev => {
                        saveToLocalStorage(prev);
                        return prev;
                    });
                }
            } catch (err) {
                console.error('Error saving session:', err);
                setSessions(prev => {
                    saveToLocalStorage(prev);
                    return prev;
                });
            }
        }
    }, [user, supabase]);

    const deleteSession = useCallback(async (id: string) => {
        // Optimistically update UI
        setSessions(prev => prev.filter(s => s.id !== id));
        if (currentSession?.id === id) {
            setCurrentSession(null);
        }

        if (user) {
            // Delete from Supabase
            try {
                const { error } = await supabase
                    .from('sessions')
                    .delete()
                    .eq('id', id);

                if (error) {
                    console.error('Failed to delete session from Supabase:', error);
                    // Reload sessions to restore state
                    const { data } = await supabase
                        .from('sessions')
                        .select('*')
                        .order('timestamp', { ascending: false });
                    if (data) {
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
    }, [user, currentSession, sessions, supabase]);

    const loadSession = useCallback((id: string) => {
        const session = sessions.find(s => s.id === id);
        if (session) {
            setCurrentSession(session);
        }
    }, [sessions]);

    const clearCurrentSession = useCallback(() => {
        setCurrentSession(null);
    }, []);

    const migrateFromLocalStorage = useCallback(async () => {
        if (!user) return;

        if (typeof window === 'undefined') return;

        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return;

        try {
            const localSessions: Session[] = JSON.parse(stored);

            // Check if there are any sessions to migrate
            if (localSessions.length === 0) return;

            // Check if sessions already exist in Supabase
            const { data: existingSessions } = await supabase
                .from('sessions')
                .select('id');

            const existingIds = new Set(existingSessions?.map(s => s.id) || []);
            const sessionsToMigrate = localSessions.filter(s => !existingIds.has(s.id));

            if (sessionsToMigrate.length === 0) {
                // All sessions already migrated, clear localStorage
                localStorage.removeItem(STORAGE_KEY);
                return;
            }

            // Insert sessions into Supabase
            const rowsToInsert = sessionsToMigrate.map(session => ({
                id: session.id,
                user_id: user.id,
                timestamp: session.timestamp,
                original_input: session.originalInput,
                input_type: session.inputType,
                analysis: session.analysis,
                same_topic_variations: session.sameTopicVariations,
                adjacent_topic_variations: session.adjacentTopicVariations,
            }));

            const { error } = await supabase
                .from('sessions')
                .insert(rowsToInsert);

            if (error) {
                console.error('Failed to migrate sessions:', error);
                throw error;
            }

            // Clear localStorage after successful migration
            localStorage.removeItem(STORAGE_KEY);

            // Reload sessions from Supabase
            const { data } = await supabase
                .from('sessions')
                .select('*')
                .order('timestamp', { ascending: false });

            if (data) {
                setSessions(data.map(rowToSession));
            }
        } catch (err) {
            console.error('Error migrating sessions:', err);
            throw err;
        }
    }, [user, supabase]);

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
                migrateFromLocalStorage,
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
