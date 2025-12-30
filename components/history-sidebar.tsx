'use client';

import { formatDistanceToNow } from 'date-fns';
import { Trash2, Clock, FileText } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAssetLibrary } from '@/hooks/use-asset-library';
import { motion, AnimatePresence } from 'framer-motion';

interface HistorySidebarProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function HistorySidebar({ open, onOpenChange }: HistorySidebarProps) {
    const { sessions, loadSession, deleteSession } = useAssetLibrary();

    const handleLoadSession = (id: string) => {
        loadSession(id);
        onOpenChange(false);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Session History
                    </SheetTitle>
                    <SheetDescription>
                        Your past analyses. Click to restore.
                    </SheetDescription>
                </SheetHeader>
                <Separator className="my-4" />
                <ScrollArea className="h-[calc(100vh-180px)] pr-4">
                    <AnimatePresence mode="popLayout">
                        {sessions.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground"
                            >
                                <FileText className="h-12 w-12 mb-4 opacity-50" />
                                <p className="text-sm">No sessions yet</p>
                                <p className="text-xs mt-1">
                                    Your analysis history will appear here
                                </p>
                            </motion.div>
                        ) : (
                            <div className="space-y-3">
                                {sessions.map((session, index) => (
                                    <motion.div
                                        key={session.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group relative rounded-lg border p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                                        onClick={() => handleLoadSession(session.id)}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {session.originalInput.slice(0, 60)}
                                                    {session.originalInput.length > 60 ? '...' : ''}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(session.timestamp, { addSuffix: true })}
                                                    </span>
                                                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted">
                                                        {session.inputType === 'voiceover' ? 'Voiceover' : 'Text Overlay'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                                    Hook: {session.analysis?.hook?.slice(0, 80) || 'N/A'}...
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteSession(session.id);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </AnimatePresence>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
