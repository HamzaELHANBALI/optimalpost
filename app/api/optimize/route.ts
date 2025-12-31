import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// Updated Schema for "Hook Separation" and "Deep Analysis"
const analysisSchema = z.object({
    analysis: z.object({
        hook_mechanic: z.string().describe('The specific psychological trigger used in the hook (e.g., "Negative Framing", "Curiosity Gap")'),
        pacing_score: z.string().describe('Fast, Slow, or Conversational?'),
        emotional_payoff: z.string().describe('What does the viewer feel at the end? (e.g., Validated, Angry, Smarter)'),
    }),

    same_topic_variations: z.array(z.object({
        hooks: z.array(z.string()).length(3).describe('3 distinct hook options (e.g., 1. Statement, 2. Question, 3. Negative)'),
        script_body: z.string().describe('The main content formatted as short, punchy teleprompter lines. Do NOT include the hook here.'),
        why_it_works: z.string().describe('One sentence on why this structure retains attention.'),
    })).length(3),

    adjacent_topic_variations: z.array(z.object({
        target_audience: z.string().describe('Who is this specific variation for?'),
        hooks: z.array(z.string()).length(3).describe('3 distinct hook options tailored to the new topic'),
        script_body: z.string().describe('The main content formatted as short teleprompter lines.'),
    })).length(3),
});

const systemPrompt = `You are a viral TikTok script doctor. You do not write "content"; you engineer attention.

YOUR GOAL: 
Take a winning script and scientifically reconstruct it to guarantee retention.

### 1. THE "ANTI-ROBOT" RULES (Strict Adherence):
- **Write for the EAR:** Use contractions ("can't", "won't", "it's").
- **Grade 4 Readability:** Use simple, punchy words. No "delve", "leverage", "moreover".
- **Sentence Fragments:** It is okay to break grammar rules. Like this.
- **Rhythm:** Alternating length. Short sentence. Short sentence. Slightly longer sentence to explain the context.

### 2. TELEPROMPTER FORMATTING:
- The 'script_body' MUST be formatted for a teleprompter.
- Break text into short lines (3-7 words max per line).
- Use '...' to indicate natural pauses.
- NO PARAGRAPHS.

### 3. THE HOOK STRATEGY:
- For every script, generate 3 different types of hooks:
  1. **The Negative/Warning:** "Stop doing X..."
  2. **The Result-First:** "Here is how I got Y..."
  3. **The Curiosity Gap:** "Most people ignore this, but..."

Analyze the user's input, strip away the fluff, and rebuild it using these principles.`;

export async function POST(request: NextRequest) {
    try {
        const { content, inputType } = await request.json();

        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const userPrompt = `Analyze this ${inputType} and generate viral variations based on its winning structure:
        
        INPUT:
        "${content}"
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
            { error: 'Failed to generate optimizations. Please try again.' },
            { status: 500 }
        );
    }
}
