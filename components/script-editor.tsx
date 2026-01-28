'use client';

import { useState, useEffect } from 'react';
import { Edit3, RotateCcw, Save, X, Loader2, Sparkles } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScriptSegment, HookOption } from '@/lib/types';

interface ScriptEditorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    hook: HookOption;
    segments: ScriptSegment[];
    framework?: string;
    pivotType?: string;
    onSave?: (edited: { hook: string; bridge: string; body: string }) => void;
}

export function ScriptEditor({
    open,
    onOpenChange,
    hook,
    segments,
    framework,
    pivotType,
    onSave,
}: ScriptEditorProps) {
    const [hookText, setHookText] = useState(hook.hook);
    const [bridgeText, setBridgeText] = useState(hook.bridge);
    const [bodyText, setBodyText] = useState(segments.map((s) => s.text).join('\n\n'));
    const [isRegenerating, setIsRegenerating] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    // Reset state when hook/segments change
    useEffect(() => {
        setHookText(hook.hook);
        setBridgeText(hook.bridge);
        setBodyText(segments.map((s) => s.text).join('\n\n'));
        setHasChanges(false);
    }, [hook, segments]);

    // Track changes
    useEffect(() => {
        const originalHook = hook.hook;
        const originalBridge = hook.bridge;
        const originalBody = segments.map((s) => s.text).join('\n\n');

        setHasChanges(
            hookText !== originalHook ||
            bridgeText !== originalBridge ||
            bodyText !== originalBody
        );
    }, [hookText, bridgeText, bodyText, hook, segments]);

    const handleRegenerate = async (section: 'hook' | 'bridge' | 'body') => {
        setIsRegenerating(section);

        try {
            const response = await fetch('/api/regenerate-section', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    section,
                    currentText: section === 'hook' ? hookText : section === 'bridge' ? bridgeText : bodyText,
                    context: {
                        hook: hookText,
                        bridge: bridgeText,
                        body: bodyText,
                        framework,
                        pivotType,
                    },
                }),
            });

            if (!response.ok) throw new Error('Failed to regenerate');

            const data = await response.json();

            if (section === 'hook') setHookText(data.text);
            else if (section === 'bridge') setBridgeText(data.text);
            else setBodyText(data.text);

            toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} regenerated!`);
        } catch (error) {
            toast.error('Failed to regenerate. Try again.');
        } finally {
            setIsRegenerating(null);
        }
    };

    const handleReset = () => {
        setHookText(hook.hook);
        setBridgeText(hook.bridge);
        setBodyText(segments.map((s) => s.text).join('\n\n'));
        toast.success('Reset to original');
    };

    const handleSave = () => {
        onSave?.({ hook: hookText, bridge: bridgeText, body: bodyText });
        toast.success('Changes saved!');
        onOpenChange(false);
    };

    const handleCopyAll = async () => {
        const fullScript = `${hookText}\n${bridgeText}\n\n${bodyText}`;
        await navigator.clipboard.writeText(fullScript);
        toast.success('Full script copied!');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Edit3 className="h-5 w-5" />
                        Script Editor
                    </DialogTitle>
                    <DialogDescription>
                        Edit your script and use AI to regenerate specific sections.
                    </DialogDescription>
                </DialogHeader>

                {/* Framework/Pivot badge */}
                {(framework || pivotType) && (
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                            {framework || pivotType}
                        </Badge>
                    </div>
                )}

                <div className="space-y-6 mt-4">
                    {/* Hook Section */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-foreground">Hook</label>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() => handleRegenerate('hook')}
                                disabled={isRegenerating !== null}
                            >
                                {isRegenerating === 'hook' ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Sparkles className="h-3 w-3" />
                                )}
                                Regenerate
                            </Button>
                        </div>
                        <Textarea
                            value={hookText}
                            onChange={(e) => setHookText(e.target.value)}
                            className="min-h-[60px] text-sm resize-none"
                            placeholder="Your hook..."
                        />
                    </div>

                    {/* Bridge Section */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-foreground">Bridge</label>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() => handleRegenerate('bridge')}
                                disabled={isRegenerating !== null}
                            >
                                {isRegenerating === 'bridge' ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Sparkles className="h-3 w-3" />
                                )}
                                Regenerate
                            </Button>
                        </div>
                        <Textarea
                            value={bridgeText}
                            onChange={(e) => setBridgeText(e.target.value)}
                            className="min-h-[60px] text-sm resize-none italic"
                            placeholder="The bridge sentence..."
                        />
                    </div>

                    <Separator />

                    {/* Body Section */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-foreground">Body</label>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() => handleRegenerate('body')}
                                disabled={isRegenerating !== null}
                            >
                                {isRegenerating === 'body' ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Sparkles className="h-3 w-3" />
                                )}
                                Regenerate
                            </Button>
                        </div>
                        <Textarea
                            value={bodyText}
                            onChange={(e) => setBodyText(e.target.value)}
                            className="min-h-[200px] text-sm resize-none"
                            placeholder="The main script content..."
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReset}
                            disabled={!hasChanges}
                        >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Reset
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyAll}
                        >
                            Copy All
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={!hasChanges}>
                            <Save className="h-4 w-4 mr-1" />
                            Save Changes
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
