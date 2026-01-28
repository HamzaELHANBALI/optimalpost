'use client';

import { useState, useEffect } from 'react';
import { Star, X, Copy, Check, Trash2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SavedScript {
    id: string;
    hookText: string;
    hookType: string;
    bridgeText: string;
    bodyText: string;
    framework?: string;
    pivotType?: string;
    hashtags: string[];
    videoTitle?: string;
    platform: string;
    collection: string;
    createdAt: string;
}

interface FavoritesSidebarProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function FavoritesSidebar({ open, onOpenChange }: FavoritesSidebarProps) {
    const [scripts, setScripts] = useState<SavedScript[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const fetchFavorites = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/favorites');
            if (response.ok) {
                const data = await response.json();
                setScripts(data.scripts || []);
            }
        } catch (error) {
            console.error('Failed to fetch favorites:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchFavorites();
        }
    }, [open]);

    const handleCopy = async (script: SavedScript) => {
        const fullScript = `${script.hookText}\n${script.bridgeText}\n\n${script.bodyText}${script.videoTitle ? `\n\n---\n📝 ${script.videoTitle}` : ''
            }${script.hashtags.length > 0 ? `\n${script.hashtags.join(' ')}` : ''}`;

        await navigator.clipboard.writeText(fullScript);
        setCopiedId(script.id);
        toast.success('Script copied!');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDelete = async (scriptId: string) => {
        try {
            const response = await fetch(`/api/favorites?id=${scriptId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setScripts((prev) => prev.filter((s) => s.id !== scriptId));
                toast.success('Removed from favorites');
            }
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        Saved Scripts
                    </SheetTitle>
                </SheetHeader>

                <div className="mt-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : scripts.length === 0 ? (
                        <div className="text-center py-12">
                            <Star className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground text-sm">
                                No saved scripts yet.
                            </p>
                            <p className="text-muted-foreground/70 text-xs mt-1">
                                Click the star icon on any variation to save it.
                            </p>
                        </div>
                    ) : (
                        <ScrollArea className="h-[calc(100vh-120px)]">
                            <div className="space-y-3 pr-4">
                                <AnimatePresence>
                                    {scripts.map((script) => (
                                        <motion.div
                                            key={script.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="group relative rounded-lg border bg-card p-4 hover:shadow-md transition-shadow"
                                        >
                                            {/* Header */}
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    {script.framework && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            {script.framework}
                                                        </Badge>
                                                    )}
                                                    {script.pivotType && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {script.pivotType}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {formatDistanceToNow(new Date(script.createdAt), {
                                                        addSuffix: true,
                                                    })}
                                                </span>
                                            </div>

                                            {/* Hook preview */}
                                            <p className="text-sm font-medium text-foreground line-clamp-2 mb-2">
                                                {script.hookText}
                                            </p>

                                            {/* Bridge preview */}
                                            <p className="text-xs text-muted-foreground line-clamp-1 italic mb-3">
                                                {script.bridgeText}
                                            </p>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-2 text-xs"
                                                    onClick={() => handleCopy(script)}
                                                >
                                                    {copiedId === script.id ? (
                                                        <Check className="h-3 w-3 mr-1 text-green-500" />
                                                    ) : (
                                                        <Copy className="h-3 w-3 mr-1" />
                                                    )}
                                                    Copy
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                                    onClick={() => handleDelete(script.id)}
                                                >
                                                    <Trash2 className="h-3 w-3 mr-1" />
                                                    Remove
                                                </Button>
                                            </div>

                                            {/* Platform badge */}
                                            <div className="absolute bottom-4 right-4">
                                                <span className="text-[10px] text-muted-foreground/50 uppercase">
                                                    {script.platform}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
