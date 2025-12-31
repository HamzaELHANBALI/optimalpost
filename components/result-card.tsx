'use client';

import { Copy, Check, MousePointerClick } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';

interface ResultCardProps {
    hooks: string[];
    body: string;
    label?: string;
    sublabel?: string;
    variant: 'double-down' | 'experiment';
    index: number;
}

export function ResultCard({ hooks, body, label, sublabel, variant, index }: ResultCardProps) {
    const [copied, setCopied] = useState(false);
    const [selectedHook, setSelectedHook] = useState(0);

    const handleCopy = async () => {
        // Copy the selected hook + the body
        const fullScript = `${hooks[selectedHook]}\n\n${body}`;
        await navigator.clipboard.writeText(fullScript);
        setCopied(true);
        toast.success('Script copied!', {
            description: 'Selected hook + body copied to clipboard.',
        });
        setTimeout(() => setCopied(false), 2000);
    };

    const isDoubleDown = variant === 'double-down';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
        >
            <Card
                className={`relative group transition-all duration-300 hover:shadow-lg overflow-hidden ${isDoubleDown
                        ? 'border-blue-500/30 hover:border-blue-500/60 bg-gradient-to-br from-blue-500/5 to-transparent'
                        : 'border-purple-500/30 hover:border-purple-500/60 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-transparent'
                    }`}
            >
                <CardContent className="pt-5 pb-4">
                    {/* Header Tags */}
                    {label && (
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            <Badge
                                variant="secondary"
                                className={`text-xs font-semibold ${isDoubleDown
                                        ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                                        : 'bg-purple-500/10 text-purple-700 dark:text-purple-300'
                                    }`}
                            >
                                {label}
                            </Badge>
                            {sublabel && (
                                <span className="text-xs text-muted-foreground/80 font-medium">
                                    • {sublabel}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Hook Selection Lab */}
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

                    {/* Script Body (Teleprompter Style) */}
                    <div className="relative">
                        <div className="font-mono text-sm leading-7 text-foreground/90 whitespace-pre-wrap pl-4 border-l-2 border-primary/20">
                            {body}
                        </div>
                    </div>

                    {/* Copy Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity ${copied ? 'text-green-500' : 'text-muted-foreground'
                            }`}
                        onClick={handleCopy}
                        title="Copy selected hook + script"
                    >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
}
