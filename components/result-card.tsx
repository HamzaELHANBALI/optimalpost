'use client';

import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ResultCardProps {
    hooks?: string[];          // 3 hook options for A/B testing (new schema)
    scriptBody?: string;       // Teleprompter-formatted body (new schema)
    content?: string;          // Legacy: full script content (old schema)
    label?: string;            // why_it_works or target_audience
    variant: 'double-down' | 'experiment';
    index: number;
}

export function ResultCard({ hooks, scriptBody, content, label, variant, index }: ResultCardProps) {
    const [copied, setCopied] = useState(false);
    const [selectedHook, setSelectedHook] = useState(0);
    const [showAllHooks, setShowAllHooks] = useState(false);

    // Backwards compatibility: handle old sessions with 'content' field
    const isLegacyFormat = !hooks || hooks.length === 0;
    const effectiveHooks = isLegacyFormat ? [content?.split('\n')[0] || 'No hook'] : hooks;
    const effectiveScriptBody = isLegacyFormat ? (content || '') : (scriptBody || '');

    const fullScript = isLegacyFormat
        ? effectiveScriptBody
        : `${effectiveHooks[selectedHook]}\n\n${effectiveScriptBody}`;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(fullScript);
        setCopied(true);
        toast.success('Copied to clipboard!', {
            description: 'Full script with selected hook copied.',
        });
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyHookOnly = async (hookIndex: number) => {
        await navigator.clipboard.writeText(effectiveHooks[hookIndex]);
        toast.success('Hook copied!', {
            description: `Hook option ${hookIndex + 1} copied.`,
        });
    };

    const isDoubleDown = variant === 'double-down';
    const hookLabels = ['Statement', 'Question', 'Negative'];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
        >
            <Card
                className={`relative group transition-all duration-300 hover:shadow-lg ${isDoubleDown
                    ? 'border-blue-500/30 hover:border-blue-500/60 bg-gradient-to-br from-blue-500/5 to-transparent'
                    : 'border-purple-500/30 hover:border-purple-500/60 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-transparent'
                    }`}
            >
                <CardContent className="pt-4 pb-3">
                    {/* Hook Selection Section */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Hook Options (A/B Test)
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => setShowAllHooks(!showAllHooks)}
                            >
                                {showAllHooks ? (
                                    <><ChevronUp className="h-3 w-3 mr-1" /> Hide</>
                                ) : (
                                    <><ChevronDown className="h-3 w-3 mr-1" /> Show All</>
                                )}
                            </Button>
                        </div>

                        {/* Hook Pills */}
                        <div className="flex flex-wrap gap-2 mb-2">
                            {effectiveHooks.map((_, hookIndex) => (
                                <button
                                    key={hookIndex}
                                    onClick={() => setSelectedHook(hookIndex)}
                                    className={`px-3 py-1.5 text-xs rounded-full transition-all ${selectedHook === hookIndex
                                        ? isDoubleDown
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-purple-500 text-white'
                                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                        }`}
                                >
                                    {hookLabels[hookIndex] || `Option ${hookIndex + 1}`}
                                </button>
                            ))}
                        </div>

                        {/* Selected Hook Preview */}
                        <div
                            className={`p-3 rounded-lg text-sm font-medium ${isDoubleDown
                                ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                                : 'bg-purple-500/10 text-purple-700 dark:text-purple-300'
                                }`}
                        >
                            {effectiveHooks[selectedHook]}
                        </div>

                        {/* All Hooks Expanded */}
                        <AnimatePresence>
                            {showAllHooks && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mt-2 space-y-2 overflow-hidden"
                                >
                                    {effectiveHooks.map((hook, hookIndex) => (
                                        <div
                                            key={hookIndex}
                                            className={`flex items-start justify-between gap-2 p-2 rounded-lg text-xs ${hookIndex === selectedHook ? 'bg-muted/50' : 'bg-muted/20'
                                                }`}
                                        >
                                            <div className="flex-1">
                                                <span className="font-medium text-muted-foreground">
                                                    {hookLabels[hookIndex]}:
                                                </span>{' '}
                                                <span>{hook}</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 shrink-0"
                                                onClick={() => handleCopyHookOnly(hookIndex)}
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Label - Why it works / Target Audience */}
                    {label && (
                        <div className="mb-3">
                            <p className={`text-xs leading-relaxed ${isDoubleDown
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-purple-600 dark:text-purple-400'
                                }`}
                            >
                                💡 {label}
                            </p>
                        </div>
                    )}

                    {/* Script Body - Teleprompter Format */}
                    <div className="relative">
                        <div className="text-sm leading-loose whitespace-pre-wrap pr-10 font-mono bg-muted/30 p-3 rounded-lg">
                            {effectiveScriptBody}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity ${copied ? 'text-green-500' : ''
                                }`}
                            onClick={handleCopy}
                            title="Copy full script with selected hook"
                        >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
