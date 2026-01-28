'use client';

import { Copy, Check, MousePointerClick, Info, Video, Hash, Edit3, Download } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScriptRunner } from '@/components/script-runner';
import { ScriptEditor } from '@/components/script-editor';
import { ExportDialog } from '@/components/export-dialog';
import { FavoritesButton } from '@/components/favorites-button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import { ScriptSegment, HookOption } from '@/lib/types';
import { cn } from '@/lib/utils';

// Framework/Pivot icons
const typeEmoji: Record<string, string> = {
    'The Myth Buster': '🔨',
    'The Negative Case Study': '📉',
    'The X vs Y': '⚖️',
    'The Common Trap': '⚠️',
    'The Industry Secret': '🔐',
    'The Next Level': '🚀',
};

// Framework descriptions for tooltips
const frameworkDescriptions: Record<string, string> = {
    'The Myth Buster': 'Challenges common beliefs by exposing the truth. Structure: Myth → Why it\'s wrong → The truth → Proof',
    'The Negative Case Study': 'Warns through failure stories. Structure: Mistake → Why it happens → The cost → The fix',
    'The X vs Y': 'Compares old vs new approaches. Structure: Old way problems → New way benefits → How to switch → Results',
    'The Common Trap': 'Reveals mistakes that come after initial success',
    'The Industry Secret': 'Shares underrated tools or hacks related to the topic',
    'The Next Level': 'Shows advanced moves after mastering the basics',
};

// Hook type styling
const hookTypeStyles: Record<string, { bg: string; text: string; label: string }> = {
    question: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', label: 'Q' },
    statement: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', label: 'S' },
    story: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', label: 'ST' },
    statistic: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', label: '#' },
};

interface ResultCardProps {
    hooks: HookOption[];
    content: ScriptSegment[];
    framework?: string;              // For same-topic: The framework name
    frameworkRationale?: string;     // Why this framework works
    pivotType?: string;              // For adjacent: The pivot strategy
    label?: string;                  // retention_tactic or pivot_topic
    sublabel?: string;               // structure_preserved
    variant: 'double-down' | 'experiment';
    index: number;
    hashtags?: string[];             // TikTok hashtags
    videoTitle?: string;             // TikTok video title/caption
}

export function ResultCard({
    hooks,
    content,
    framework,
    frameworkRationale,
    pivotType,
    label,
    sublabel,
    variant,
    index,
    hashtags,
    videoTitle
}: ResultCardProps) {
    const [copied, setCopied] = useState(false);
    const [selectedHookIndex, setSelectedHookIndex] = useState(0);
    const [scriptRunnerOpen, setScriptRunnerOpen] = useState(false);
    const [scriptEditorOpen, setScriptEditorOpen] = useState(false);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);

    const activeHook = hooks[selectedHookIndex];

    const handleCopy = async () => {
        // Format: Hook -> Bridge -> Body -> Title -> Hashtags
        const bodyText = content.map(c => c.text).join('\n\n');
        let fullScript = `${activeHook.hook}\n${activeHook.bridge}\n\n${bodyText}`;

        if (videoTitle) {
            fullScript += `\n\n---\n📝 ${videoTitle}`;
        }
        if (hashtags && hashtags.length > 0) {
            fullScript += `\n${hashtags.join(' ')}`;
        }

        await navigator.clipboard.writeText(fullScript);
        setCopied(true);
        toast.success('Script copied!', {
            description: 'Hook + Bridge + Body + Title + Hashtags copied to clipboard.',
        });
        setTimeout(() => setCopied(false), 2000);
    };

    const isDoubleDown = variant === 'double-down';
    const typeLabel = framework || pivotType;
    const emoji = typeLabel ? (typeEmoji[typeLabel] || '✨') : '✨';
    const description = typeLabel ? frameworkDescriptions[typeLabel] : undefined;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
        >
            <Card className={cn(
                "group relative overflow-hidden transition-all duration-200 border border-border shadow-sm bg-card text-card-foreground hover:shadow-md"
            )}>
                <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1",
                    isDoubleDown ? "bg-primary" : "bg-purple-500"
                )} />

                <CardContent className="pt-5 pb-4 pl-6 pr-5">
                    {/* Header: Framework Badge with Tooltip */}
                    <div className="flex items-start justify-between mb-4">
                        {typeLabel && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border border-border text-xs font-medium text-foreground cursor-help">
                                            <span>{emoji}</span>
                                            {typeLabel}
                                            {description && <Info className="h-3 w-3 text-muted-foreground ml-0.5" />}
                                        </div>
                                    </TooltipTrigger>
                                    {description && (
                                        <TooltipContent className="max-w-xs">
                                            <p className="text-xs leading-relaxed">{description}</p>
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        <div className="flex items-center gap-1">
                            <FavoritesButton
                                hook={activeHook}
                                segments={content}
                                framework={framework}
                                pivotType={pivotType}
                                hashtags={hashtags}
                                videoTitle={videoTitle}
                                className="-mt-1 opacity-0 group-hover:opacity-100"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 -mt-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary"
                                onClick={() => setScriptEditorOpen(true)}
                                title="Edit Script"
                            >
                                <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 -mt-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary"
                                onClick={() => setScriptRunnerOpen(true)}
                                title="Open in Script Runner"
                            >
                                <Video className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 -mt-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary"
                                onClick={() => setExportDialogOpen(true)}
                                title="Export"
                            >
                                <Download className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Framework Rationale */}
                    {frameworkRationale && (
                        <div className="mb-4 text-xs text-muted-foreground/90 italic">
                            <span className="font-semibold text-foreground/70">Why this works:</span> {frameworkRationale}
                        </div>
                    )}

                    {/* Metadata */}
                    {(label || sublabel) && (
                        <div className="mb-4 text-xs text-muted-foreground/80 space-y-1">
                            {label && (
                                <p>
                                    <span className="font-semibold text-foreground/70">
                                        {isDoubleDown ? '💡 Retention: ' : '🎯 Topic: '}
                                    </span>
                                    {label}
                                </p>
                            )}
                            {sublabel && (
                                <p>
                                    <span className="font-semibold text-foreground/70">🔗 Structure: </span>
                                    {sublabel}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Hook Selector */}
                    <div className="space-y-2 mb-5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <MousePointerClick className="h-3 w-3" /> Select Hook
                        </p>
                        <div className="grid gap-2">
                            {hooks.map((h, i) => {
                                const hookStyle = hookTypeStyles[h.hook_type] || hookTypeStyles.statement;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedHookIndex(i)}
                                        className={cn(
                                            "text-left w-full p-2.5 rounded-md text-sm transition-all border",
                                            selectedHookIndex === i
                                                ? "bg-primary/5 border-primary/20 text-foreground ring-1 ring-primary/10"
                                                : "bg-transparent border-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <div className="flex items-start gap-2">
                                            <span className={cn(
                                                "font-mono text-xs mt-0.5",
                                                selectedHookIndex === i ? "text-primary font-bold" : "opacity-50"
                                            )}>
                                                0{i + 1}
                                            </span>
                                            {/* Hook Type Badge */}
                                            <span className={cn(
                                                "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide mt-0.5",
                                                hookStyle.bg,
                                                hookStyle.text
                                            )}>
                                                {hookStyle.label}
                                            </span>
                                            <div className="flex-1">
                                                <span className="font-medium">{h.hook}</span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <Separator className="mb-5" />

                    {/* SCRIPT DISPLAY */}
                    <div className="space-y-4 pl-4 border-l-2 border-muted">

                        {/* THE BRIDGE (Dynamic) */}
                        <div className="relative">
                            <span className="absolute -left-[26px] top-1 text-[9px] font-mono text-primary/60 select-none">
                                BR
                            </span>
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={activeHook.bridge}
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    transition={{ duration: 0.2 }}
                                    className="text-sm leading-relaxed text-foreground font-semibold italic"
                                >
                                    {activeHook.bridge}
                                </motion.p>
                            </AnimatePresence>
                        </div>

                        {/* THE BODY (Static) */}
                        {content.map((cut, i) => (
                            <div key={i} className="relative">
                                <span className="absolute -left-[26px] top-1 text-[9px] font-mono text-muted-foreground/40 select-none">
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                                <p className="text-sm leading-relaxed text-foreground/90 font-medium">
                                    {cut.text}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* TikTok Video Title & Hashtags */}
                    {(videoTitle || (hashtags && hashtags.length > 0)) && (
                        <div className="mt-5 pt-4 border-t border-border/50 space-y-3">
                            {/* Video Title */}
                            {videoTitle && (
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        📝 Video Title
                                    </p>
                                    <p className="text-sm text-foreground/90 font-medium bg-muted/30 px-3 py-2 rounded-md">
                                        {videoTitle}
                                    </p>
                                </div>
                            )}

                            {/* Hashtags */}
                            {hashtags && hashtags.length > 0 && (
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        <Hash className="h-3 w-3" /> Hashtags
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {hashtags.map((tag, i) => (
                                            <span
                                                key={i}
                                                className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
                                            >
                                                {tag.startsWith('#') ? tag : `#${tag}`}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Script Runner Dialog */}
            <ScriptRunner
                open={scriptRunnerOpen}
                onOpenChange={setScriptRunnerOpen}
                hook={activeHook}
                segments={content}
            />

            {/* Script Editor Dialog */}
            <ScriptEditor
                open={scriptEditorOpen}
                onOpenChange={setScriptEditorOpen}
                hook={activeHook}
                segments={content}
                framework={framework}
                pivotType={pivotType}
            />

            {/* Export Dialog */}
            <ExportDialog
                open={exportDialogOpen}
                onOpenChange={setExportDialogOpen}
                hook={activeHook}
                segments={content}
                framework={framework}
                pivotType={pivotType}
                hashtags={hashtags}
                videoTitle={videoTitle}
            />
        </motion.div>
    );
}
