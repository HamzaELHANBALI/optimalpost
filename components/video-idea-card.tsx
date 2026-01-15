'use client';

import { Copy, Check, ArrowRight, Lightbulb } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { VideoIdea } from '@/lib/types';
import { cn } from '@/lib/utils';

interface VideoIdeaCardProps {
    idea: VideoIdea;
    index: number;
    onUseInAnalyzer?: (idea: VideoIdea) => void;
}

export function VideoIdeaCard({ idea, index, onUseInAnalyzer }: VideoIdeaCardProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const text = `${idea.title}\n\n${idea.hook}\n\n${idea.rationale}`;
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Idea copied!', {
            description: 'Title, hook, and rationale copied to clipboard.',
        });
        setTimeout(() => setCopied(false), 2000);
    };

    const handleUseInAnalyzer = () => {
        if (onUseInAnalyzer) {
            onUseInAnalyzer(idea);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
        >
            <Card className={cn(
                "group relative overflow-hidden transition-all duration-200 border border-border shadow-sm bg-card text-card-foreground hover:shadow-md"
            )}>
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500" />

                <CardContent className="pt-5 pb-4 pl-6 pr-5">
                    {/* Header with actions */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-blue-500/10">
                                <Lightbulb className="h-4 w-4 text-blue-500" />
                            </div>
                            <span className="text-xs font-mono text-muted-foreground">
                                #{String(index + 1).padStart(2, '0')}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-8 w-8 transition-opacity",
                                    copied ? "text-green-600 bg-green-50 dark:bg-green-950" : "text-muted-foreground opacity-0 group-hover:opacity-100"
                                )}
                                onClick={handleCopy}
                            >
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold mb-3 text-foreground leading-tight">
                        {idea.title}
                    </h3>

                    {/* Hook */}
                    <div className="mb-4 p-3 rounded-md bg-muted/50 border border-border/50">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                            Hook
                        </p>
                        <p className="text-sm font-medium text-foreground italic">
                            {idea.hook}
                        </p>
                    </div>

                    {/* Rationale */}
                    <div className="mb-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                            Why This Works
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {idea.rationale}
                        </p>
                    </div>

                    {/* Action Button */}
                    {onUseInAnalyzer && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={handleUseInAnalyzer}
                        >
                            Use in Analyzer
                            <ArrowRight className="h-3.5 w-3.5 ml-2" />
                        </Button>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
