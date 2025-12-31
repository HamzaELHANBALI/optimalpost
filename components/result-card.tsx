'use client';

import { Copy, Check, MousePointerClick } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import { ScriptSegment } from '@/lib/types';

// Archetype/Pivot icons
const typeEmoji: Record<string, string> = {
    'The Rant': '🔥',
    'The Analyst': '📊',
    'The Storyteller': '📖',
    'The Contrarian': '🎭',
    'The Coach': '💪',
    'The Common Trap': '⚠️',
    'The Industry Secret': '🔐',
    'The Next Level': '🚀',
    'The Origin Story': '🌱',
    'The Comparison': '⚖️',
};

interface ResultCardProps {
    hooks: string[];
    content: ScriptSegment[];     // Visual cuts array
    angleType?: string;           // For same-topic: The archetype
    pivotType?: string;           // For adjacent: The pivot strategy
    label?: string;               // retention_tactic or pivot_topic
    sublabel?: string;            // structure_preserved
    variant: 'double-down' | 'experiment';
    index: number;
}

export function ResultCard({ hooks, content, angleType, pivotType, label, sublabel, variant, index }: ResultCardProps) {
    const [copied, setCopied] = useState(false);
    const [selectedHook, setSelectedHook] = useState(0);

    const handleCopy = async () => {
        // Format: Hook + double newline between each cut
        const scriptText = content.map(c => c.text).join('\n\n');
        const fullScript = `${hooks[selectedHook]}\n\n${scriptText}`;

        await navigator.clipboard.writeText(fullScript);
        setCopied(true);
        toast.success('Script copied!', {
            description: 'Hook + all cuts copied to clipboard.',
        });
        setTimeout(() => setCopied(false), 2000);
    };

    const isDoubleDown = variant === 'double-down';
    const typeLabel = angleType || pivotType;
    const emoji = typeLabel ? typeEmoji[typeLabel] || '✨' : '✨';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.3 }}
        >
            <Card
                className={`relative group transition-all duration-300 hover:shadow-lg overflow-hidden ${isDoubleDown
                    ? 'border-blue-500/30 hover:border-blue-500/60 bg-gradient-to-br from-blue-500/5 to-transparent'
                    : 'border-purple-500/30 hover:border-purple-500/60 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-transparent'
                    }`}
            >
                <CardContent className="pt-5 pb-4">
                    {/* Archetype/Pivot Type Header */}
                    {typeLabel && (
                        <div className="mb-4">
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${isDoubleDown
                                ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                                : 'bg-purple-500/15 text-purple-700 dark:text-purple-300'
                                }`}>
                                <span className="text-base">{emoji}</span>
                                {typeLabel}
                            </div>
                        </div>
                    )}

                    {/* Strategy/Topic Info */}
                    {(label || sublabel) && (
                        <div className="mb-4 text-xs text-muted-foreground space-y-1">
                            {label && (
                                <p className="leading-relaxed">
                                    <span className="font-medium text-foreground/80">
                                        {isDoubleDown ? '💡 Retention: ' : '🎯 Topic: '}
                                    </span>
                                    {label}
                                </p>
                            )}
                            {sublabel && (
                                <p className="leading-relaxed">
                                    <span className="font-medium text-foreground/80">🔗 Structure: </span>
                                    {sublabel}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Hook Selection */}
                    <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            <MousePointerClick className="h-3 w-3" />
                            Select a Hook
                        </div>
                        <div className="grid gap-2">
                            {hooks.map((hook, i) => (
                                <div
                                    key={i}
                                    onClick={() => setSelectedHook(i)}
                                    className={`p-2.5 rounded-md text-sm cursor-pointer transition-all border ${selectedHook === i
                                        ? 'bg-background border-primary/50 shadow-sm ring-1 ring-primary/20'
                                        : 'bg-muted/30 border-transparent hover:bg-muted/50 hover:border-border'
                                        }`}
                                >
                                    <span className={`mr-2 font-bold ${selectedHook === i ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {i + 1}.
                                    </span>
                                    {hook}
                                </div>
                            ))}
                        </div>
                    </div>

                    <Separator className="my-4 opacity-50" />

                    {/* Visual Cuts - Segmented Script */}
                    <div className="space-y-4 ml-6 pl-4 border-l-2 border-primary/20">
                        {content.map((cut, i) => (
                            <div key={i} className="relative group/cut">
                                {/* Cut number indicator - positioned outside the border */}
                                <span className="absolute -left-10 top-1 text-[10px] font-mono text-muted-foreground/60 group-hover/cut:text-primary transition-colors w-5 text-right">
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                                <p className="text-sm leading-6 text-foreground/90">
                                    {cut.text}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Copy Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity ${copied ? 'text-green-500' : 'text-muted-foreground'
                            }`}
                        onClick={handleCopy}
                        title="Copy selected hook + all cuts"
                    >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
}
