import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Max file size: 25MB (OpenAI Whisper limit)
const MAX_FILE_SIZE = 25 * 1024 * 1024;

// Supported audio/video formats
const SUPPORTED_TYPES = [
    'audio/mpeg',       // .mp3
    'audio/mp4',        // .m4a
    'audio/wav',        // .wav
    'audio/webm',       // .webm audio
    'video/mp4',        // .mp4
    'video/webm',       // .webm video
    'video/quicktime',  // .mov
];

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 25MB.' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!SUPPORTED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: 'Unsupported file format. Please upload MP3, MP4, M4A, WAV, WebM, or MOV.' },
                { status: 400 }
            );
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'OpenAI API key not configured' },
                { status: 500 }
            );
        }

        // Call OpenAI Whisper API
        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: 'whisper-1',
            response_format: 'text',
        });

        return NextResponse.json({
            transcript: transcription,
            filename: file.name,
            duration: null, // Whisper doesn't return duration in text format
        });
    } catch (error) {
        console.error('Transcription error:', error);

        if (error instanceof OpenAI.APIError) {
            return NextResponse.json(
                { error: `Transcription failed: ${error.message}` },
                { status: error.status || 500 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to transcribe audio' },
            { status: 500 }
        );
    }
}
