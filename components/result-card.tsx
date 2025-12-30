'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface ResultCardProps {
    content: string;
    label?: string;
    sublabel?: string;
    variant: 'double-down' | 'experiment';
    index: number;
}

export function ResultCard({ content, label, sublabel, variant, index }: ResultCardProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        toast.success('Copied to clipboard!', {
            description: 'Script copied successfully.',
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
                className={`relative group transition-all duration-300 hover:shadow-lg ${isDoubleDown
                        ? 'border-blue-500/30 hover:border-blue-500/60 bg-gradient-to-br from-blue-500/5 to-transparent'
                        : 'border-purple-500/30 hover:border-purple-500/60 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-transparent'
                    }`}
            >
                <CardContent className="pt-4 pb-3">
                    {label && (
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <Badge
                                variant="secondary"
                                className={`text-xs ${isDoubleDown
                                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                        : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                    }`}
                            >
                                {label}
                            </Badge>
                            {sublabel && (
                                <span className="text-xs text-muted-foreground">
                                    {sublabel}
                                </span>
                            )}
                        </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap pr-10">{content}</p>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity ${copied ? 'text-green-500' : ''
                            }`}
                        onClick={handleCopy}
                    >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
}
