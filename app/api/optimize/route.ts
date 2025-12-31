import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// Schema for the AI response with detailed analysis
const analysisSchema = z.object({
    analysis: z.object({
        hook: z.string().describe('What hook was used to grab attention in the first 1-3 seconds? Be specific.'),
        structure: z.string().describe('Break down the script structure: Opening → Build-up → Payoff. What pattern does it follow?'),
        retention_mechanics: z.string().describe('What psychological triggers keep viewers watching? (curiosity gaps, open loops, pattern interrupts, etc.)'),
        niche_and_audience: z.string().describe('What niche is this content in? Who is the target audience? (e.g., "Software engineering - targeting junior developers and CS students")'),
        topic_angle: z.string().describe('What is the specific topic and the unique angle/perspective taken?'),
        emotional_driver: z.string().describe('What emotion does this content trigger? (fear, curiosity, aspiration, controversy, etc.)'),
    }).describe('Detailed breakdown of why this content worked'),

    same_topic_variations: z.array(z.object({
        content: z.string().describe('The full script variation'),
        hook_used: z.string().describe('Brief description of the hook approach'),
    })).length(3).describe('3 scripts using the SAME topic but with different hooks/angles. These are for recreating the video with fresh takes.'),

    adjacent_topic_variations: z.array(z.object({
        content: z.string().describe('The full script variation'),
        pivot_topic: z.string().describe('What adjacent topic within the same niche this explores'),
        structure_preserved: z.string().describe('What structural elements were kept from the original'),
    })).length(3).describe('3 scripts pivoting to ADJACENT topics within the SAME NICHE. Example: if original is about "dev tools", pivot to "soft skills for devs" or "career tips for engineers" - same audience, different subject.'),
});

const systemPrompt = `You are a viral content analyst and scriptwriter for short-form video (TikTok, Reels, Shorts).

Your job is to:
1. DEEPLY ANALYZE why a piece of content performed well
2. CREATE NEW SCRIPTS that replicate or expand on its success

## Analysis Framework
When analyzing content, identify:
- **THE HOOK**: How does it grab attention instantly? (Question? Bold claim? Pattern interrupt? Visual cue reference?)
- **THE STRUCTURE**: What's the narrative arc? (Problem→Solution, Myth→Truth, Story→Lesson, List format, etc.)
- **RETENTION MECHANICS**: What keeps people watching? (Curiosity gaps, "wait for it", escalation, open loops)
- **NICHE & AUDIENCE**: Who is this content for? What community/industry does it serve?
- **EMOTIONAL TRIGGERS**: What feelings does it evoke? (FOMO, controversy, aspiration, relatability, shock)

## Script Generation Rules

For "Same Topic Variations" (Recreating the video):
- Keep the EXACT same topic and core message
- Change the hook approach (if original used a question, try a bold statement)
- Maintain the same structure and pacing
- Refresh examples and specific details
- These should feel like "takes 2, 3, 4" of the same video

For "Adjacent Topic Variations" (Pivoting within the niche):
- STAY WITHIN THE SAME NICHE - same target audience
- PRESERVE the winning structure and hook pattern
- PIVOT to a RELATED but DIFFERENT subject that the same audience cares about
- Example: If original is "tools every software engineer needs", adjacent topics could be:
  - "Soft skills that get developers promoted"
  - "Mistakes junior developers make"
  - "How to prepare for tech interviews"
  - "Side projects that impress recruiters"
- NOT a completely different niche (don't go from coding to cooking)
- These should feel like "what else would my audience want to learn?"

Match the original's length, tone, and energy level precisely.`;

export async function POST(request: NextRequest) {
    try {
        const { content, inputType } = await request.json();

        if (!content || content.trim().length === 0) {
            return NextResponse.json(
                { error: 'Content is required' },
                { status: 400 }
            );
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'OpenAI API key is not configured' },
                { status: 500 }
            );
        }

        const userPrompt = `Analyze this ${inputType === 'voiceover' ? 'voiceover script' : 'text overlay'} from a viral video and generate variations:

"""
${content}
"""

Provide a deep analysis of why this worked, then generate:
1. Three variations on the SAME topic (for recreating the video)
2. Three variations applying this formula to NEW topics (for branching out)`;

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
