'use client';

import { motion } from 'framer-motion';
import { Check, X, Zap, Clock, Target, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { AuthDialog } from '@/components/auth/auth-dialog';

const comparisons = [
    {
        feature: 'Source of content',
        traditional: 'Random AI generation',
        provenpost: 'YOUR proven viral content',
    },
    {
        feature: 'Success rate',
        traditional: 'Hit or miss',
        provenpost: 'Replicates what already works',
    },
    {
        feature: 'Your voice',
        traditional: 'Generic AI tone',
        provenpost: 'Preserves your unique style',
    },
    {
        feature: 'Learning curve',
        traditional: 'Complex prompt engineering',
        provenpost: 'Paste script, get results',
    },
];

const valueProps = [
    {
        icon: Clock,
        stat: '10x Faster',
        description: 'Hours of manual analysis → 30 seconds',
    },
    {
        icon: Target,
        stat: '10+ Variations',
        description: 'From a single viral script',
    },
    {
        icon: Repeat,
        stat: 'Repeatable',
        description: 'Success formula, not one-offs',
    },
];

export function ValueSection() {
    const [authDialogOpen, setAuthDialogOpen] = useState(false);

    return (
        <section className="py-24 sm:py-32 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-muted/30" />

            <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                {/* Header */}
                <div className="mx-auto max-w-2xl text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm shadow-sm"
                    >
                        <Zap className="h-4 w-4 text-amber-500" />
                        <span className="text-muted-foreground">Real Value, Not Hype</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
                    >
                        Not Just Another AI Tool
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mt-4 text-lg text-muted-foreground"
                    >
                        Other tools generate random content. We extract the exact formula
                        from <span className="font-semibold text-foreground">your</span> best content—so you replicate success, not guess.
                    </motion.p>
                </div>

                {/* Comparison table */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mx-auto mt-16 max-w-3xl"
                >
                    <div className="overflow-hidden rounded-2xl border bg-card shadow-lg">
                        {/* Table header */}
                        <div className="grid grid-cols-3 gap-4 border-b bg-muted/50 p-4 text-sm font-semibold">
                            <div className="text-muted-foreground"></div>
                            <div className="text-center text-muted-foreground">Generic AI Tools</div>
                            <div className="text-center text-primary">ProvenPost</div>
                        </div>

                        {/* Table rows */}
                        {comparisons.map((row, index) => (
                            <div
                                key={row.feature}
                                className={`grid grid-cols-3 gap-4 p-4 ${index < comparisons.length - 1 ? 'border-b' : ''
                                    }`}
                            >
                                <div className="text-sm font-medium text-foreground">
                                    {row.feature}
                                </div>
                                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                    <X className="h-4 w-4 text-red-400" />
                                    <span className="hidden sm:inline">{row.traditional}</span>
                                </div>
                                <div className="flex items-center justify-center gap-2 text-sm text-foreground">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span className="hidden sm:inline">{row.provenpost}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Value stats */}
                <div className="mx-auto mt-16 grid max-w-4xl gap-8 sm:grid-cols-3">
                    {valueProps.map((prop, index) => {
                        const Icon = prop.icon;
                        return (
                            <motion.div
                                key={prop.stat}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                                className="text-center"
                            >
                                <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                                    <Icon className="h-7 w-7 text-primary" />
                                </div>
                                <div className="text-3xl font-bold text-foreground">{prop.stat}</div>
                                <div className="mt-1 text-sm text-muted-foreground">{prop.description}</div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="mt-16 text-center"
                >
                    <Button
                        size="lg"
                        onClick={() => setAuthDialogOpen(true)}
                        className="h-12 px-8 text-base font-semibold shadow-lg transition-all hover:shadow-xl"
                    >
                        Try It Free — See the Difference
                    </Button>
                    <p className="mt-3 text-sm text-muted-foreground">
                        No credit card required. Start with your first viral script.
                    </p>
                </motion.div>
            </div>

            <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
        </section>
    );
}
