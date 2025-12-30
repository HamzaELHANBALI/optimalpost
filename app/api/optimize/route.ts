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
        topic_angle: z.string().describe('What is the core topic and the unique angle/perspective taken?'),
        emotional_driver: z.string().describe('What emotion does this content trigger? (fear, curiosity, aspiration, controversy, etc.)'),
    }).describe('Detailed breakdown of why this content worked'),

    same_topic_variations: z.array(z.object({
        content: z.string().describe('The full script variation'),
        hook_used: z.string().describe('Brief description of the hook approach'),
    })).length(3).describe('3 scripts using the SAME topic but with different hooks/angles. These are for recreating the video with fresh takes.'),

    new_topic_variations: z.array(z.object({
        content: z.string().describe('The full script variation'),
        new_topic: z.string().describe('The new topic this variation explores'),
        structure_preserved: z.string().describe('What structural elements were kept from the original'),
    })).length(3).describe('3 scripts applying the SAME winning structure/hook pattern to DIFFERENT topics. These expand your content into new territories.'),
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
- **EMOTIONAL TRIGGERS**: What feelings does it evoke? (FOMO, controversy, aspiration, relatability, shock)

## Script Generation Rules

For "Same Topic Variations" (Recreating the video):
- Keep the EXACT same topic and core message
- Change the hook approach (if original used a question, try a bold statement)
- Maintain the same structure and pacing
- Refresh examples and specific details
- These should feel like "takes 2, 3, 4" of the same video

For "New Topic Variations" (Branching out):
- PRESERVE the winning structure that worked
- PRESERVE the hook pattern/style
- Apply these to COMPLETELY DIFFERENT topics
- The new topics should appeal to a similar or adjacent audience
- These should feel like "what if I used this formula for X instead?"

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
