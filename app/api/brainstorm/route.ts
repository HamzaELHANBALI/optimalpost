import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { BrainstormRequest, VideoIdea } from '@/lib/types';

const videoIdeaSchema = z.object({
    ideas: z.array(z.object({
        title: z.string().describe('The video title/topic idea'),
        hook: z.string().describe('A scroll-stopping opening hook for this video'),
        rationale: z.string().describe('Why this idea fits the user\'s niche and audience (1-2 sentences)'),
    })).min(3).max(20),
});

const systemPrompt = `You are a Content Strategy AI that analyzes a creator's content history to understand their niche, audience, and what works.

### YOUR TASK:
1. **Analyze the provided sessions** to identify:
   - The creator's niche and target audience
   - Common themes and topics that appear frequently
   - Successful hook patterns and structures
   - Emotional drivers that resonate
   - Content angles that perform well

2. **Identify Outliers**:
   - Sessions that deviate significantly from the main niche
   - Topics that don't align with the core content strategy
   - Content that seems experimental or off-brand
   - Exclude these from your analysis - they should NOT influence the ideas you generate

3. **Extract Patterns**:
   - What topics/themes appear most frequently?
   - What hook types work best (question, statement, story, statistic)?
   - What emotional drivers are most common?
   - What audience pain points are addressed?
   - What content angles or frameworks are used?

4. **Generate Coherent Ideas**:
   - Create video ideas that align with the identified niche
   - Use similar hook patterns that have worked
   - Address the same audience pain points
   - Maintain the same tone and style
   - Ensure all ideas feel cohesive and on-brand
   - Introduce fresh angles while staying true to the niche

### OUTPUT REQUIREMENTS:
- Each idea must have a clear, compelling title
- Each idea must include a scroll-stopping hook (opening line)
- Each idea must explain why it fits the niche (rationale)
- Ideas should feel fresh but aligned with successful patterns
- Avoid generic ideas - make them specific to the identified niche
- All ideas should be coherent with each other and the niche

### QUALITY STANDARDS:
- Titles should be specific, not generic
- Hooks should match the style and type that works for this creator
- Rationale should clearly connect the idea to the niche patterns
- Ideas should be actionable and ready to use`;

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: BrainstormRequest = await request.json();
        const { sessionIds, ideaCount } = body;

        if (!sessionIds || sessionIds.length === 0) {
            return NextResponse.json({ error: 'At least one session ID is required' }, { status: 400 });
        }

        if (!ideaCount || ideaCount < 3 || ideaCount > 20) {
            return NextResponse.json({ error: 'Idea count must be between 3 and 20' }, { status: 400 });
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
        }

        // Fetch selected sessions from database
        const sessions = await prisma.analysisSession.findMany({
            where: {
                id: { in: sessionIds },
                userId: session.user.id, // Ensure user owns these sessions
            },
        });

        if (sessions.length === 0) {
            return NextResponse.json({ error: 'No valid sessions found' }, { status: 404 });
        }

        // Prepare session data for AI analysis
        const sessionData = sessions.map(s => ({
            originalInput: s.originalInput,
            analysis: s.analysis as any,
            sameTopicVariations: s.sameTopicVariations as any,
            adjacentTopicVariations: s.adjacentTopicVariations as any,
        }));

        // Create prompt with session history
        const userPrompt = `Analyze the following content history from a creator and generate ${ideaCount} new video ideas that align with their niche.

CONTENT HISTORY:
${sessionData.map((s, idx) => `
--- Session ${idx + 1} ---
Original Content: ${s.originalInput.slice(0, 500)}${s.originalInput.length > 500 ? '...' : ''}
Niche & Audience: ${s.analysis?.niche_and_audience || 'N/A'}
Topic Angle: ${s.analysis?.topic_angle || 'N/A'}
Hook: ${s.analysis?.hook || 'N/A'}
Emotional Driver: ${s.analysis?.emotional_driver || 'N/A'}
Structure: ${s.analysis?.structure || 'N/A'}
`).join('\n')}

INSTRUCTIONS:
1. First, identify the main niche and patterns across these sessions
2. Identify any outliers that don't fit the main niche (and ignore them)
3. Extract what works: common topics, hook types, emotional drivers, audience needs
4. Generate ${ideaCount} fresh video ideas that:
   - Align with the identified niche
   - Use similar successful patterns
   - Address the same audience
   - Feel cohesive and on-brand
   - Offer fresh angles while staying true to what works

Each idea should include:
- A compelling, specific title
- A scroll-stopping hook (opening line)
- A brief rationale explaining why it fits the niche`;

        const result = await generateObject({
            model: openai('gpt-4o'),
            schema: videoIdeaSchema,
            system: systemPrompt,
            prompt: userPrompt,
        });

        // Ensure we have the exact number requested
        const ideas = result.object.ideas.slice(0, ideaCount);

        return NextResponse.json({ ideas });
    } catch (error) {
        console.error('Brainstorm error:', error);
        return NextResponse.json(
            { error: 'Failed to generate ideas' },
            { status: 500 }
        );
    }
}
