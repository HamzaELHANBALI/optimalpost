'use client';

import { useState } from 'react';
import { Sparkles, FileText, ArrowRight } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { STARTER_TEMPLATES, NICHE_OPTIONS, getTemplatesByNiche, StarterTemplate } from '@/lib/templates';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TemplateBrowserProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectTemplate: (script: string) => void;
}

export function TemplateBrowser({ open, onOpenChange, onSelectTemplate }: TemplateBrowserProps) {
    const [selectedNiche, setSelectedNiche] = useState('all');
    const [selectedTemplate, setSelectedTemplate] = useState<StarterTemplate | null>(null);

    const filteredTemplates = getTemplatesByNiche(selectedNiche);

    const handleUseTemplate = (template: StarterTemplate) => {
        onSelectTemplate(template.script);
        onOpenChange(false);
        setSelectedTemplate(null);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <Sparkles className="h-6 w-6 text-yellow-500" />
                        Template Library
                    </DialogTitle>
                    <DialogDescription>
                        Start with a proven script template. Customize it for your niche and voice.
                    </DialogDescription>
                </DialogHeader>

                {/* Niche Filter Tabs */}
                <div className="flex flex-wrap gap-2 pb-4 border-b">
                    {NICHE_OPTIONS.map((niche) => (
                        <Button
                            key={niche.value}
                            variant={selectedNiche === niche.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedNiche(niche.value)}
                            className="text-sm"
                        >
                            {niche.label}
                        </Button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {selectedTemplate ? (
                        /* Template Preview */
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col overflow-hidden"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedTemplate(null)}
                                >
                                    ← Back to templates
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold">{selectedTemplate.title}</h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="secondary">{selectedTemplate.nicheLabel}</Badge>
                                        <Badge variant="outline">{selectedTemplate.framework}</Badge>
                                    </div>
                                </div>

                                <ScrollArea className="h-[300px] rounded-md border p-4">
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                        {selectedTemplate.script}
                                    </p>
                                </ScrollArea>

                                <div className="flex items-center justify-end gap-2 pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        onClick={() => setSelectedTemplate(null)}
                                    >
                                        Choose Different
                                    </Button>
                                    <Button
                                        onClick={() => handleUseTemplate(selectedTemplate)}
                                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                                    >
                                        Use This Template
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        /* Template Grid */
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex flex-col overflow-hidden"
                        >
                            <ScrollArea className="h-[400px]">
                                <div className="grid md:grid-cols-2 gap-4 p-1">
                                    {filteredTemplates.map((template, index) => (
                                        <motion.div
                                            key={template.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Card
                                                className={cn(
                                                    "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
                                                    "group"
                                                )}
                                                onClick={() => setSelectedTemplate(template)}
                                            >
                                                <CardContent className="p-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                                                                {template.title}
                                                            </h4>
                                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                                {template.preview}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-3">
                                                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                                                    {template.nicheLabel}
                                                                </Badge>
                                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                                    {template.framework}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <FileText className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary/50 transition-colors shrink-0" />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            </ScrollArea>

                            <div className="flex items-center justify-end gap-2 pt-4 border-t mt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
