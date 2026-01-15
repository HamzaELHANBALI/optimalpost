'use client';

import { useState, useEffect } from 'react';
import { Brain, Loader2, Sparkles, History, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VideoIdeaCard } from '@/components/video-idea-card';
import { useAssetLibrary } from '@/hooks/use-asset-library';
import { VideoIdea, BrainstormSession } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BrainstormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUseIdea?: (idea: VideoIdea) => void;
}

const loadingMessages = [
    'Analyzing your content history...',
    'Identifying niche patterns...',
    'Filtering outliers...',
    'Extracting successful themes...',
    'Generating fresh ideas...',
];

export function BrainstormDialog({ open, onOpenChange, onUseIdea }: BrainstormDialogProps) {
    const { sessions } = useAssetLibrary();
    const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
    const [ideaCount, setIdeaCount] = useState(5);
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
    const [ideas, setIdeas] = useState<VideoIdea[]>([]);
    const [step, setStep] = useState<'select' | 'results' | 'history'>('select');
    const [history, setHistory] = useState<BrainstormSession[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [selectedHistorySession, setSelectedHistorySession] = useState<BrainstormSession | null>(null);

    // Select all sessions by default when dialog opens
    useEffect(() => {
        if (open && sessions.length > 0) {
            setSelectedSessions(new Set(sessions.map(s => s.id)));
            setStep('select');
            setIdeas([]);
        }
    }, [open, sessions]);

    // Cycle loading messages
    useEffect(() => {
        if (!isGenerating) return;
        let index = 0;
        const interval = setInterval(() => {
            index = (index + 1) % loadingMessages.length;
            setLoadingMessage(loadingMessages[index]);
        }, 2000);
        return () => clearInterval(interval);
    }, [isGenerating]);

    const toggleSession = (sessionId: string) => {
        setSelectedSessions(prev => {
            const next = new Set(prev);
            if (next.has(sessionId)) {
                next.delete(sessionId);
            } else {
                next.add(sessionId);
            }
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedSessions.size === sessions.length) {
            setSelectedSessions(new Set());
        } else {
            setSelectedSessions(new Set(sessions.map(s => s.id)));
        }
    };

    const handleGenerate = async () => {
        if (selectedSessions.size === 0) {
            toast.error('Please select at least one session');
            return;
        }

        setIsGenerating(true);
        setStep('select');

        try {
            const response = await fetch('/api/brainstorm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionIds: Array.from(selectedSessions),
                    ideaCount,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to generate ideas');
            }

            const data = await response.json();
            setIdeas(data.ideas);
            setStep('results');
            toast.success('Ideas generated!', {
                description: `Generated ${data.ideas.length} video ideas based on your content history.`,
            });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to generate ideas');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleUseIdea = (idea: VideoIdea) => {
        if (onUseIdea) {
            onUseIdea(idea);
            onOpenChange(false);
        }
    };

    const handleRegenerate = () => {
        setIdeas([]);
        setStep('select');
    };

    // Fetch brainstorm history
    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const response = await fetch('/api/brainstorm/history');
            if (response.ok) {
                const data = await response.json();
                setHistory(data.sessions);
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('History fetch error:', response.status, errorData);
                toast.error(`Failed to load history: ${errorData.error || response.statusText}`);
            }
        } catch (err) {
            console.error('History fetch exception:', err);
            toast.error('Failed to load history');
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // Delete a history session
    const deleteHistorySession = async (sessionId: string) => {
        try {
            const response = await fetch(`/api/brainstorm/history?id=${sessionId}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setHistory(prev => prev.filter(s => s.id !== sessionId));
                if (selectedHistorySession?.id === sessionId) {
                    setSelectedHistorySession(null);
                }
                toast.success('Session deleted');
            }
        } catch (err) {
            toast.error('Failed to delete session');
        }
    };

    // View history
    const handleViewHistory = () => {
        setStep('history');
        fetchHistory();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <Brain className="h-6 w-6 text-purple-500" />
                        Content Brainstorming
                    </DialogTitle>
                    <DialogDescription>
                        Analyze your content history to generate fresh video ideas that align with your niche
                    </DialogDescription>
                </DialogHeader>

                <AnimatePresence mode="wait">
                    {step === 'select' && (
                        <motion.div
                            key="select"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col overflow-hidden"
                        >
                            {/* Session Selection */}
                            <div className="space-y-4 flex flex-col">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold">Select Sessions</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Choose which content to analyze ({selectedSessions.size} selected)
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={toggleSelectAll}
                                    >
                                        {selectedSessions.size === sessions.length ? 'Deselect All' : 'Select All'}
                                    </Button>
                                </div>

                                <ScrollArea className="h-[250px] border rounded-md">
                                    <div className="p-4 space-y-2">
                                        {sessions.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <p className="text-sm">No sessions available</p>
                                                <p className="text-xs mt-1">Create some content analyses first</p>
                                            </div>
                                        ) : (
                                            sessions.map((session) => (
                                                <label
                                                    key={session.id}
                                                    className={cn(
                                                        "flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors",
                                                        selectedSessions.has(session.id)
                                                            ? "bg-primary/5 border-primary/20"
                                                            : "bg-background hover:bg-muted/50"
                                                    )}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedSessions.has(session.id)}
                                                        onChange={() => toggleSession(session.id)}
                                                        className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">
                                                            {session.originalInput.slice(0, 80)}
                                                            {session.originalInput.length > 80 ? '...' : ''}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatDistanceToNow(session.timestamp, { addSuffix: true })}
                                                            </span>
                                                            <span className="text-xs px-1.5 py-0.5 rounded bg-muted">
                                                                {session.inputType === 'transcribed' ? 'Transcribed' : 'Script'}
                                                            </span>
                                                        </div>
                                                        {session.analysis?.hook && (
                                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                                                Hook: {session.analysis.hook.slice(0, 60)}...
                                                            </p>
                                                        )}
                                                    </div>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>

                                {/* Idea Count Configuration */}
                                <div className="space-y-2 pt-4 border-t">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium">
                                            Number of Ideas
                                        </label>
                                        <span className="text-sm text-muted-foreground">
                                            {ideaCount} ideas
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="3"
                                        max="20"
                                        value={ideaCount}
                                        onChange={(e) => setIdeaCount(Number(e.target.value))}
                                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>3</span>
                                        <span>20</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-4 border-t">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleViewHistory}
                                    className="text-muted-foreground"
                                >
                                    <History className="h-4 w-4 mr-2" />
                                    History
                                </Button>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => onOpenChange(false)}
                                        disabled={isGenerating}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleGenerate}
                                        disabled={isGenerating || selectedSessions.size === 0}
                                        className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                                    >
                                        {isGenerating ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                {loadingMessage}
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <Sparkles className="h-4 w-4" />
                                                Generate Ideas
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 'results' && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold">Generated Ideas</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {ideas.length} ideas based on {selectedSessions.size} session{selectedSessions.size !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRegenerate}
                                >
                                    Regenerate
                                </Button>
                            </div>

                            <ScrollArea className="h-[350px]">
                                <div className="grid md:grid-cols-2 gap-4 p-1">
                                    {ideas.map((idea, index) => (
                                        <VideoIdeaCard
                                            key={index}
                                            idea={idea}
                                            index={index}
                                            onUseInAnalyzer={onUseIdea ? () => handleUseIdea(idea) : undefined}
                                        />
                                    ))}
                                </div>
                            </ScrollArea>

                            <div className="flex items-center justify-end gap-2 pt-4 border-t mt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Close
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'history' && (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold">Brainstorm History</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {history.length} past session{history.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>

                            {isLoadingHistory ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : selectedHistorySession ? (
                                <>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedHistorySession(null)}
                                        >
                                            ← Back to list
                                        </Button>
                                        <span className="text-sm text-muted-foreground">
                                            {formatDistanceToNow(new Date(selectedHistorySession.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <ScrollArea className="h-[300px]">
                                        <div className="grid md:grid-cols-2 gap-4 p-1">
                                            {(selectedHistorySession.ideas as VideoIdea[]).map((idea, index) => (
                                                <VideoIdeaCard
                                                    key={index}
                                                    idea={idea}
                                                    index={index}
                                                    onUseInAnalyzer={onUseIdea ? () => handleUseIdea(idea) : undefined}
                                                />
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </>
                            ) : history.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>No brainstorm history yet</p>
                                    <p className="text-sm">Generate some ideas to see them here</p>
                                </div>
                            ) : (
                                <ScrollArea className="h-[300px] border rounded-md">
                                    <div className="p-2 space-y-2">
                                        {history.map((session) => (
                                            <div
                                                key={session.id}
                                                className="flex items-center justify-between p-3 rounded-md border bg-background hover:bg-muted/50 cursor-pointer transition-colors"
                                                onClick={() => setSelectedHistorySession(session)}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium">
                                                        {session.ideaCount} ideas generated
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-muted-foreground hover:text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteHistorySession(session.id);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t mt-4">
                                <Button
                                    variant="ghost"
                                    onClick={() => setStep('select')}
                                >
                                    ← Back to Generator
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Close
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
