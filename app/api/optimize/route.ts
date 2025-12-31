// app/api/optimize/route.ts
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// 1. IMPROVED SCHEMA: Separates Hooks and Enforces Retention Logic
const analysisSchema = z.object({
    analysis: z.object({
        hook: z.string().describe('The specific hook used in the original'),
        structure: z.string().describe('The narrative arc (e.g. Problem -> Agitate -> Solution)'),
        retention_mechanics: z.string().describe('Psychological triggers used (e.g. Open loops, Pattern interrupts)'),
        niche_and_audience: z.string().describe('Target audience definition'),
        topic_angle: z.string().describe('The specific angle taken'),
        emotional_driver: z.string().describe('Core emotion (Fear, Greed, Curiosity)'),
    }),

    same_topic_variations: z.array(z.object({
        hooks: z.array(z.string()).length(3).describe('3 DISTINCT hook options (A/B test). One aggressive, one curiosity-based, one story-based.'),
        script_body: z.string().describe('The script content formatted as vertical teleprompter lines. DO NOT include the hook here.'),
        retention_tactic: z.string().describe('One specific tactic used in this variation to keep viewers watching until the end.'),
    })).length(3),

    adjacent_topic_variations: z.array(z.object({
        hooks: z.array(z.string()).length(3).describe('3 distinct hook options tailored to the new topic'),
        script_body: z.string().describe('The script content formatted as vertical teleprompter lines.'),
        pivot_topic: z.string().describe('The adjacent topic being explored'),
        structure_preserved: z.string().describe('What structural element was kept'),
    })).length(3),
});

// 2. & 3. SYSTEM PROMPT UPGRADE: Teleprompter Format + Anti-AI Tone
const systemPrompt = `You are an expert Short-Form Video Strategist. You do not write "text"; you engineer attention for TikTok/Reels.

### 1. TONE RULES (CRITICAL):
- **NO AI WORDS:** Strictly banned: "Unleash", "Unlock", "Master", "Delve", "In the world of", "Leverage", "Game-changer".
- **Speak Human:** Use contractions ("Can't" not "Cannot"). Use simple, punchy language (Grade 4 reading level).
- **Be Polarizing:** If the topic allows, take a strong stance. Passive language kills views.

### 2. FORMATTING RULES (TELEPROMPTER):
- **Verticality:** Output the 'script_body' as a vertical list of short lines.
- **Breath Groups:** Max 4-7 words per line.
- **Rhythm:** Use "..." to indicate pauses/beats.
- **NO PARAGRAPHS.**

### 3. YOUR TASK:
1. Analyze the input script's "Viral DNA" (Hook, Structure, Payoff).
2. Generate variations that keep this DNA but refresh the content.
3. For every script, provide 3 distinct "Hook" options so the user can test what works.
`;

export async function POST(request: NextRequest) {
    try {
        const { content, inputType } = await request.json();

        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
        }

        const userPrompt = `Analyze this ${inputType} and generate viral variations:
        
        INPUT CONTENT:
        """
        ${content}
        """
        `;

        const result = await generateObject({
            model: openai('gpt-4o'),
            schema: analysisSchema,
            system: systemPrompt,
            prompt: userPrompt,
        });

        return NextResponse.json(result.object);
    } catch (error) {
        console.error('Optimization error:', error);
        return NextResponse.json(
            { error: 'Failed to generate optimizations' },
            { status: 500 }
        );
    }
}
