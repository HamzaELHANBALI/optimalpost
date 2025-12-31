import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// IMPROVED SCHEMA: Enforcing "Archetypes" and "Pivots" with 5 variations each
const analysisSchema = z.object({
    analysis: z.object({
        hook: z.string().describe('The specific hook used in the original'),
        structure: z.string().describe('The narrative arc'),
        retention_mechanics: z.string().describe('Psychological triggers used'),
        niche_and_audience: z.string().describe('Target audience definition'),
        topic_angle: z.string().describe('The specific angle taken'),
        emotional_driver: z.string().describe('Core emotion'),
    }),

    same_topic_variations: z.array(z.object({
        angle_type: z.string().describe('The archetype used: "The Rant", "The Analyst", "The Storyteller", "The Contrarian", or "The Coach"'),
        hooks: z.array(z.string()).length(3).describe('3 DISTINCT hooks matching this specific angle type.'),
        script_body: z.string().describe('The script body. MUST match the tone of the angle_type (e.g. Rant = angry/fast, Analyst = calm/precise, Storyteller = personal).'),
        retention_tactic: z.string().describe('Specific tactic used to keep retention for this angle.'),
    })).length(5).describe('Generate exactly 5 variations using these archetypes: 1. The Rant (Polarizing), 2. The Analyst (Educational), 3. The Storyteller (Personal POV), 4. The Contrarian (Myth-busting), 5. The Coach (Motivational).'),

    adjacent_topic_variations: z.array(z.object({
        pivot_type: z.string().describe('The pivot strategy: "The Common Trap", "The Industry Secret", "The Next Level", "The Origin Story", or "The Comparison"'),
        hooks: z.array(z.string()).length(3).describe('3 hooks tailored to this new adjacent topic.'),
        script_body: z.string().describe('The script body for the new topic.'),
        pivot_topic: z.string().describe('The specific adjacent topic being covered.'),
        structure_preserved: z.string().describe('Which structural element was kept from the original winning video.'),
    })).length(5).describe('Generate exactly 5 pivots: 1. The Common Trap (Mistake), 2. The Industry Secret (Underrated tool/hack), 3. The Next Level (Advanced), 4. The Origin Story (Why this matters), 5. The Comparison (X vs Y).'),
});

// SYSTEM PROMPT: "Editor's Knife" + Archetypes + Pivot Matrix
const systemPrompt = `You are an expert Short-Form Video Strategist. You do not write "content"; you engineer attention.

### 1. THE "NO FLUFF" POLICY (Strict Rules):
- **Delete the Intro:** Never say "In this video", "Here's why", "Let's dive in". Start immediately with the concept.
- **No AI-Speak:** BAN words like: Unleash, Master, Delve, Landscape, Tap into, Game-changer, Leverage.
- **Breath Groups:** Write in short, punchy lines (3-7 words). NO PARAGRAPHS.
- **Talk Like a Human:** Use contractions ("Can't" not "Cannot"). Use simple words (Grade 4 level).

### 2. SAME-TOPIC ARCHETYPES (5 Distinct Vibes):
Each variation MUST have a completely different energy:
1. **The Rant (Polarizing):** High energy, angry, frustrated. "Stop doing X! It's ruining your Y."
2. **The Analyst (Logical):** Calm, factual, data-driven. "Here is the exact math/steps."
3. **The Storyteller (Personal POV):** First-person experience. "I tried X for 30 days. Here's what happened."
4. **The Contrarian (Myth-Buster):** Challenge common beliefs. "Everyone says X, but they're wrong."
5. **The Coach (Motivational):** Supportive, encouraging. "You got this. Here's how to finally nail X."

### 3. ADJACENT-TOPIC PIVOTS (5 Strategic Vectors):
Do not guess random topics. Use these precise vectors:
1. **The Trap:** What mistake do people make *after* the original topic?
2. **The Secret:** What underrated tool/hack exists in this niche?
3. **The Next Step:** What's the advanced move after mastering the basic?
4. **The Origin Story:** Why does this topic even matter? The "before" state.
5. **The Comparison:** What's the X vs Y debate in this space?

### 4. HOOK DIVERSITY:
For each variation, the 3 hooks must be:
- Hook 1: Aggressive/Direct ("Stop doing X")
- Hook 2: Curiosity Gap ("Most people ignore this...")
- Hook 3: Result-First ("How I got X result in Y time")

Analyze the input, extract the "Viral DNA", and generate these specific strategic variations.`;

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
