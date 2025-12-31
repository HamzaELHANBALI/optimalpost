import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// SCHEMA: Archetypes, Pivots, and Visual Cuts
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
        angle_type: z.string().describe('The archetype: "The Rant", "The Analyst", "The Storyteller", "The Contrarian", or "The Coach"'),
        hooks: z.array(z.string()).length(3).describe('3 DISTINCT hooks matching this angle type.'),
        script_content: z.array(z.object({
            text: z.string().describe('Exactly 2 coherent sentences for this cut. Sentence 1 = setup, Sentence 2 = punch/elaboration. Creates tension for next cut.'),
        })).min(4).max(5).describe('4-5 distinct visual cuts. Each cut has 2 sentences that flow together. Creates rhythm for retention editing.'),
        retention_tactic: z.string().describe('Specific tactic used to keep retention for this angle.'),
    })).length(5).describe('5 variations: Rant, Analyst, Storyteller, Contrarian, Coach.'),

    adjacent_topic_variations: z.array(z.object({
        pivot_type: z.string().describe('The pivot: "The Common Trap", "The Industry Secret", "The Next Level", "The Origin Story", or "The Comparison"'),
        hooks: z.array(z.string()).length(3).describe('3 hooks tailored to this adjacent topic.'),
        script_content: z.array(z.object({
            text: z.string().describe('Exactly 2 coherent sentences for this cut. Setup + punch/elaboration.'),
        })).min(4).max(5).describe('4-5 distinct visual cuts with 2 sentences each.'),
        pivot_topic: z.string().describe('The specific adjacent topic being covered.'),
        structure_preserved: z.string().describe('Which structural element was kept from the original.'),
    })).length(5).describe('5 pivots: Trap, Secret, Next Level, Origin Story, Comparison.'),
});

// SYSTEM PROMPT: Visual Cuts + Anti-Fluff + Archetypes
const systemPrompt = `You are an expert Short-Form Video Strategist. You engineer retention through visual pacing.

### 1. THE "CUT" SYSTEM (Critical):
- **Think in Camera Cuts:** Each "cut" in script_content represents a new visual/beat.
- **2 Sentences Per Cut:** Each cut MUST have exactly 2 coherent, connected sentences. First sentence = setup, second = punch or elaboration.
- **Retention Optimized:** Each cut should create micro-tension that pulls into the next cut.
- **Typical Flow (4-5 cuts):**
  - Cut 1: Context + Why it matters
  - Cut 2: The core truth + Proof/Example
  - Cut 3: The twist + What most miss
  - Cut 4: The actionable step + Result
  - Cut 5: (Optional) Payoff + Open loop for comments
- **Natural Rhythm:** Cuts should feel complete but create momentum to the next.

### 2. THE "NO FLUFF" POLICY:
- **Delete the Intro:** Never say "In this video", "Here's why", "Let's dive in". Start immediately.
- **No AI-Speak:** BAN: Unleash, Master, Delve, Landscape, Tap into, Game-changer, Leverage.
- **Spoken English:** Use contractions ("It's", "Don't", "Can't").
- **Grade 4 level:** Simple, punchy words.

### 3. SAME-TOPIC ARCHETYPES (5 Vibes):
1. **The Rant (Polarizing):** Angry, frustrated. "Stop doing X!"
2. **The Analyst (Logical):** Calm, data-driven. "Here's the math."
3. **The Storyteller (Personal):** First-person. "I tried this for 30 days."
4. **The Contrarian (Myth-Buster):** "Everyone's wrong about..."
5. **The Coach (Motivational):** "You got this. Here's how."

### 4. ADJACENT-TOPIC PIVOTS (5 Vectors):
1. **The Trap:** Mistake after initial success.
2. **The Secret:** Underrated tool/hack.
3. **The Next Step:** Advanced move.
4. **The Origin Story:** Why this matters.
5. **The Comparison:** X vs Y debate.

### 5. HOOK DIVERSITY:
Each variation's 3 hooks must be:
- Hook 1: Aggressive/Direct
- Hook 2: Curiosity Gap
- Hook 3: Result-First

Extract the viral DNA and reconstruct it into high-retention cuts.`;

export async function POST(request: NextRequest) {
    try {
        const { content, inputType } = await request.json();

        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
        }

        const userPrompt = `Analyze this ${inputType} and generate viral variations with distinct visual cuts:
        
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
