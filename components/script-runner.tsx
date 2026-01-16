'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Play,
    Pause,
    RotateCcw,
    Volume2,
    VolumeX,
    ChevronLeft,
    ChevronRight,
    Maximize,
    Minimize,
    Settings,
    X,
    FlipHorizontal
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScriptSegment, HookOption } from '@/lib/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ScriptRunnerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    hook: HookOption;
    segments: ScriptSegment[];
}

export function ScriptRunner({ open, onOpenChange, hook, segments }: ScriptRunnerProps) {
    // Teleprompter state
    const [isPlaying, setIsPlaying] = useState(false);
    const [scrollSpeed, setScrollSpeed] = useState(1);
    const [fontSize, setFontSize] = useState(32);
    const [isMirrored, setIsMirrored] = useState(false);
    const teleprompterRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | null>(null);

    // Cue cards state
    const [currentCardIndex, setCurrentCardIndex] = useState(0);

    // TTS state
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [ttsSupported, setTtsSupported] = useState(false);

    // Build full script
    const fullScript = [hook.hook, hook.bridge, ...segments.map(s => s.text)].join('\n\n');
    const allCards = [
        { label: 'Hook', text: hook.hook },
        { label: 'Bridge', text: hook.bridge },
        ...segments.map((s, i) => ({ label: `Cut ${i + 1}`, text: s.text }))
    ];

    // Check TTS support
    useEffect(() => {
        setTtsSupported('speechSynthesis' in window);
    }, []);

    // Teleprompter scroll animation
    const startScrolling = useCallback(() => {
        if (!teleprompterRef.current) return;

        const scroll = () => {
            if (teleprompterRef.current) {
                teleprompterRef.current.scrollTop += scrollSpeed * 0.5;
                animationRef.current = requestAnimationFrame(scroll);
            }
        };
        animationRef.current = requestAnimationFrame(scroll);
    }, [scrollSpeed]);

    const stopScrolling = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (isPlaying) {
            startScrolling();
        } else {
            stopScrolling();
        }
        return stopScrolling;
    }, [isPlaying, startScrolling, stopScrolling]);

    // Reset on close
    useEffect(() => {
        if (!open) {
            setIsPlaying(false);
            setCurrentCardIndex(0);
            stopSpeaking();
            if (teleprompterRef.current) {
                teleprompterRef.current.scrollTop = 0;
            }
        }
    }, [open]);

    // TTS functions
    const speak = useCallback(() => {
        if (!ttsSupported) return;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(fullScript);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
    }, [fullScript, ttsSupported]);

    const stopSpeaking = useCallback(() => {
        if (ttsSupported) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
    }, [ttsSupported]);

    const resetTeleprompter = () => {
        setIsPlaying(false);
        if (teleprompterRef.current) {
            teleprompterRef.current.scrollTop = 0;
        }
    };

    const nextCard = () => {
        if (currentCardIndex < allCards.length - 1) {
            setCurrentCardIndex(prev => prev + 1);
        }
    };

    const prevCard = () => {
        if (currentCardIndex > 0) {
            setCurrentCardIndex(prev => prev - 1);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-4 pb-2 border-b shrink-0">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl">Script Runner</DialogTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="teleprompter" className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-3 mx-4 mt-2 max-w-md">
                        <TabsTrigger value="teleprompter">Teleprompter</TabsTrigger>
                        <TabsTrigger value="cards">Cue Cards</TabsTrigger>
                        <TabsTrigger value="audio">Audio Preview</TabsTrigger>
                    </TabsList>

                    {/* Teleprompter Tab */}
                    <TabsContent value="teleprompter" className="flex-1 flex flex-col overflow-hidden mt-0 p-4 pt-2">
                        {/* Controls */}
                        <div className="flex items-center justify-between gap-4 py-3 border-b mb-4">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant={isPlaying ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setIsPlaying(!isPlaying)}
                                >
                                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={resetTeleprompter}
                                >
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={isMirrored ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setIsMirrored(!isMirrored)}
                                    title="Mirror (for camera reflection)"
                                >
                                    <FlipHorizontal className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Speed</span>
                                    <input
                                        type="range"
                                        value={scrollSpeed}
                                        onChange={(e) => setScrollSpeed(Number(e.target.value))}
                                        min={0.5}
                                        max={3}
                                        step={0.5}
                                        className="w-24 h-1.5 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <span className="text-xs w-8">{scrollSpeed}x</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Size</span>
                                    <input
                                        type="range"
                                        value={fontSize}
                                        onChange={(e) => setFontSize(Number(e.target.value))}
                                        min={20}
                                        max={48}
                                        step={4}
                                        className="w-24 h-1.5 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <span className="text-xs w-8">{fontSize}px</span>
                                </div>
                            </div>
                        </div>

                        {/* Teleprompter Display */}
                        <div
                            ref={teleprompterRef}
                            className={cn(
                                "flex-1 overflow-y-auto bg-black text-white p-8 rounded-lg",
                                isMirrored && "scale-x-[-1]"
                            )}
                        >
                            <div
                                className="max-w-3xl mx-auto text-center leading-relaxed"
                                style={{ fontSize: `${fontSize}px` }}
                            >
                                {/* Spacer at top */}
                                <div className="h-[40vh]" />

                                {/* Hook */}
                                <p className="mb-8 font-bold text-yellow-400">{hook.hook}</p>

                                {/* Bridge */}
                                <p className="mb-8 italic text-blue-300">{hook.bridge}</p>

                                {/* Body segments */}
                                {segments.map((segment, i) => (
                                    <p key={i} className="mb-6">{segment.text}</p>
                                ))}

                                {/* Spacer at bottom */}
                                <div className="h-[60vh]" />
                            </div>
                        </div>
                    </TabsContent>

                    {/* Cue Cards Tab */}
                    <TabsContent value="cards" className="flex-1 flex flex-col overflow-hidden mt-0 p-4 pt-2">
                        <div className="flex-1 flex flex-col items-center justify-center">
                            {/* Card Display */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentCardIndex}
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    className="w-full max-w-2xl"
                                >
                                    <div className="bg-card border-2 rounded-xl p-8 shadow-lg min-h-[300px] flex flex-col">
                                        <div className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wider">
                                            {allCards[currentCardIndex].label} ({currentCardIndex + 1}/{allCards.length})
                                        </div>
                                        <p className="text-2xl leading-relaxed font-medium flex-1 flex items-center justify-center text-center">
                                            {allCards[currentCardIndex].text}
                                        </p>
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Navigation */}
                            <div className="flex items-center gap-4 mt-6">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={prevCard}
                                    disabled={currentCardIndex === 0}
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                    Previous
                                </Button>
                                <div className="flex gap-1">
                                    {allCards.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentCardIndex(i)}
                                            className={cn(
                                                "w-2 h-2 rounded-full transition-colors",
                                                i === currentCardIndex ? "bg-primary" : "bg-muted-foreground/30"
                                            )}
                                        />
                                    ))}
                                </div>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={nextCard}
                                    disabled={currentCardIndex === allCards.length - 1}
                                >
                                    Next
                                    <ChevronRight className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Keyboard hint */}
                            <p className="text-xs text-muted-foreground mt-4">
                                Use arrow keys or swipe to navigate
                            </p>
                        </div>
                    </TabsContent>

                    {/* Audio Preview Tab */}
                    <TabsContent value="audio" className="flex-1 flex flex-col overflow-hidden mt-0 p-4 pt-2">
                        <div className="flex-1 flex flex-col items-center justify-center">
                            {ttsSupported ? (
                                <>
                                    <div className="text-center mb-8">
                                        <h3 className="text-xl font-semibold mb-2">Audio Preview</h3>
                                        <p className="text-muted-foreground">
                                            Listen to your script read aloud to check rhythm and flow
                                        </p>
                                    </div>

                                    <Button
                                        size="lg"
                                        variant={isSpeaking ? 'destructive' : 'default'}
                                        onClick={isSpeaking ? stopSpeaking : speak}
                                        className="h-16 px-8 text-lg"
                                    >
                                        {isSpeaking ? (
                                            <>
                                                <VolumeX className="h-6 w-6 mr-2" />
                                                Stop
                                            </>
                                        ) : (
                                            <>
                                                <Volume2 className="h-6 w-6 mr-2" />
                                                Play Audio
                                            </>
                                        )}
                                    </Button>

                                    {/* Script preview */}
                                    <div className="mt-8 w-full max-w-2xl">
                                        <div className="bg-muted/50 rounded-lg p-4 max-h-[300px] overflow-y-auto">
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                {fullScript}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center">
                                    <VolumeX className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                    <h3 className="text-xl font-semibold mb-2">Audio Not Available</h3>
                                    <p className="text-muted-foreground">
                                        Your browser doesn&apos;t support text-to-speech. Try Chrome or Safari.
                                    </p>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
