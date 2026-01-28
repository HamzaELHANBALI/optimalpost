'use client';

import { useState } from 'react';
import { Download, FileText, Copy, Check, Hash, FileCode } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ScriptSegment, HookOption } from '@/lib/types';

interface ExportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    hook: HookOption;
    segments: ScriptSegment[];
    framework?: string;
    pivotType?: string;
    hashtags?: string[];
    videoTitle?: string;
}

type ExportFormat = 'markdown' | 'plain' | 'capcut' | 'tiktok';

export function ExportDialog({
    open,
    onOpenChange,
    hook,
    segments,
    framework,
    pivotType,
    hashtags,
    videoTitle,
}: ExportDialogProps) {
    const [copiedFormat, setCopiedFormat] = useState<ExportFormat | null>(null);

    const bodyText = segments.map((s) => s.text).join('\n\n');

    const formatters: Record<ExportFormat, { label: string; icon: typeof FileText; description: string; format: () => string }> = {
        markdown: {
            label: 'Markdown',
            icon: FileCode,
            description: 'Full script with headers',
            format: () => {
                let md = `# ${framework || pivotType || 'Script'}\n\n`;
                md += `## Hook\n${hook.hook}\n\n`;
                md += `## Bridge\n${hook.bridge}\n\n`;
                md += `## Body\n${segments.map((s, i) => `${i + 1}. ${s.text}`).join('\n\n')}\n`;
                if (videoTitle) md += `\n---\n**Title:** ${videoTitle}\n`;
                if (hashtags?.length) md += `\n**Hashtags:** ${hashtags.join(' ')}\n`;
                return md;
            },
        },
        plain: {
            label: 'Plain Text',
            icon: FileText,
            description: 'Copy-paste ready',
            format: () => {
                let text = `${hook.hook}\n${hook.bridge}\n\n${bodyText}`;
                if (videoTitle) text += `\n\n---\n${videoTitle}`;
                if (hashtags?.length) text += `\n${hashtags.join(' ')}`;
                return text;
            },
        },
        capcut: {
            label: 'CapCut Format',
            icon: FileText,
            description: 'With segment markers',
            format: () => {
                let text = `[HOOK]\n${hook.hook}\n\n`;
                text += `[BRIDGE]\n${hook.bridge}\n\n`;
                text += `[BODY]\n`;
                segments.forEach((s, i) => {
                    text += `--- CUT ${i + 1} ---\n${s.text}\n\n`;
                });
                return text.trim();
            },
        },
        tiktok: {
            label: 'TikTok Ready',
            icon: Hash,
            description: 'Caption + hashtags only',
            format: () => {
                let text = hook.hook;
                if (videoTitle) text = videoTitle;
                if (hashtags?.length) text += `\n\n${hashtags.join(' ')}`;
                return text;
            },
        },
    };

    const handleExport = async (format: ExportFormat) => {
        const text = formatters[format].format();
        await navigator.clipboard.writeText(text);
        setCopiedFormat(format);
        toast.success(`Copied as ${formatters[format].label}!`);
        setTimeout(() => setCopiedFormat(null), 2000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        Export Script
                    </DialogTitle>
                    <DialogDescription>
                        Choose a format for your script
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 mt-4">
                    {(Object.keys(formatters) as ExportFormat[]).map((format) => {
                        const { label, icon: Icon, description } = formatters[format];
                        const isCopied = copiedFormat === format;

                        return (
                            <button
                                key={format}
                                onClick={() => handleExport(format)}
                                className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-left"
                            >
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Icon className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-foreground">{label}</div>
                                    <div className="text-xs text-muted-foreground">{description}</div>
                                </div>
                                <div className="text-muted-foreground">
                                    {isCopied ? (
                                        <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                <Separator className="my-4" />

                <div className="text-xs text-muted-foreground text-center">
                    Click any format to copy to clipboard
                </div>
            </DialogContent>
        </Dialog>
    );
}
