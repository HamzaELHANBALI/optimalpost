'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { HookOption, ScriptSegment } from '@/lib/types';

interface FavoritesButtonProps {
    hook: HookOption;
    segments: ScriptSegment[];
    framework?: string;
    pivotType?: string;
    hashtags?: string[];
    videoTitle?: string;
    platform?: string;
    sessionId?: string;
    className?: string;
}

export function FavoritesButton({
    hook,
    segments,
    framework,
    pivotType,
    hashtags,
    videoTitle,
    platform = 'tiktok',
    sessionId,
    className,
}: FavoritesButtonProps) {
    const [isSaved, setIsSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [savedId, setSavedId] = useState<string | null>(null);

    const handleToggleFavorite = async () => {
        setIsLoading(true);

        try {
            if (isSaved && savedId) {
                // Remove from favorites
                const response = await fetch(`/api/favorites?id=${savedId}`, {
                    method: 'DELETE',
                });

                if (!response.ok) throw new Error('Failed to remove');

                setIsSaved(false);
                setSavedId(null);
                toast.success('Removed from favorites');
            } else {
                // Add to favorites
                const bodyText = segments.map((s) => s.text).join('\n\n');

                const response = await fetch('/api/favorites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId,
                        hookText: hook.hook,
                        hookType: hook.hook_type,
                        bridgeText: hook.bridge,
                        bodyText,
                        framework,
                        pivotType,
                        hashtags,
                        videoTitle,
                        platform,
                    }),
                });

                if (!response.ok) throw new Error('Failed to save');

                const data = await response.json();
                setIsSaved(true);
                setSavedId(data.script.id);
                toast.success('Saved to favorites!', {
                    description: 'Find it in your Favorites sidebar.',
                });
            }
        } catch (error) {
            toast.error(isSaved ? 'Failed to remove' : 'Failed to save');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className={cn(
                'h-8 w-8 transition-all',
                isSaved
                    ? 'text-yellow-500 hover:text-yellow-600'
                    : 'text-muted-foreground hover:text-yellow-500',
                className
            )}
            onClick={handleToggleFavorite}
            disabled={isLoading}
            title={isSaved ? 'Remove from favorites' : 'Save to favorites'}
        >
            <Star
                className={cn('h-4 w-4 transition-all', isSaved && 'fill-current')}
            />
        </Button>
    );
}
