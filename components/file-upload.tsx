'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, File, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ACCEPTED_TYPES = [
    'audio/mpeg',
    'audio/mp4',
    'audio/wav',
    'audio/webm',
    'video/mp4',
    'video/webm',
    'video/quicktime',
];
const ACCEPTED_EXTENSIONS = '.mp3,.mp4,.m4a,.wav,.webm,.mov';

interface FileUploadProps {
    onTranscriptReady: (transcript: string) => void;
    disabled?: boolean;
}

export function FileUpload({ onTranscriptReady, disabled }: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [transcriptReady, setTranscriptReady] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
        if (file.size > MAX_FILE_SIZE) {
            return 'File too large. Maximum size is 25MB.';
        }
        if (!ACCEPTED_TYPES.includes(file.type)) {
            return 'Unsupported format. Please upload MP3, MP4, M4A, WAV, WebM, or MOV.';
        }
        return null;
    };

    const handleFile = useCallback(async (selectedFile: File) => {
        setError(null);
        setTranscriptReady(false);

        const validationError = validateFile(selectedFile);
        if (validationError) {
            setError(validationError);
            return;
        }

        setFile(selectedFile);
        setIsUploading(true);
        setUploadProgress(0);

        // Simulate progress during upload
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 300);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData,
            });

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Transcription failed');
            }

            const data = await response.json();
            setTranscriptReady(true);
            onTranscriptReady(data.transcript);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setFile(null);
        } finally {
            clearInterval(progressInterval);
            setIsUploading(false);
        }
    }, [onTranscriptReady]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFile(droppedFile);
        }
    }, [handleFile]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            handleFile(selectedFile);
        }
    }, [handleFile]);

    const handleReset = () => {
        setFile(null);
        setError(null);
        setTranscriptReady(false);
        setUploadProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="space-y-4">
            {/* Drop Zone */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
                className={`
                    relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                    transition-all duration-200
                    ${isDragging
                        ? 'border-primary bg-primary/5 scale-[1.02]'
                        : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                    }
                    ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_EXTENSIONS}
                    onChange={handleInputChange}
                    className="hidden"
                    disabled={disabled || isUploading}
                />

                <AnimatePresence mode="wait">
                    {isUploading ? (
                        <motion.div
                            key="uploading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Transcribing audio...</p>
                                <div className="w-48 mx-auto h-2 bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-primary"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${uploadProgress}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {file?.name}
                                </p>
                            </div>
                        </motion.div>
                    ) : transcriptReady ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-green-600">
                                    Transcription complete!
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {file?.name} • {file && formatFileSize(file.size)}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleReset();
                                }}
                            >
                                <X className="h-4 w-4 mr-1" />
                                Upload Different File
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto">
                                <Upload className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium">
                                    Drop your audio or video file here
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    or click to browse
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                                <span className="px-2 py-1 rounded bg-muted">MP3</span>
                                <span className="px-2 py-1 rounded bg-muted">MP4</span>
                                <span className="px-2 py-1 rounded bg-muted">M4A</span>
                                <span className="px-2 py-1 rounded bg-muted">WAV</span>
                                <span className="px-2 py-1 rounded bg-muted">WebM</span>
                                <span className="px-2 py-1 rounded bg-muted">MOV</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Max file size: 25MB
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Error Display */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
