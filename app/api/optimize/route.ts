import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// ENHANCED SCHEMA: Bridge Logic + Framework Metadata + Hook Types
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
        framework: z.string().describe('The Viral Framework used: "The Myth Buster", "The Negative Case Study", or "The X vs Y"'),
        framework_rationale: z.string().describe('Why this framework works for this topic (1 sentence, max 20 words)'),
        hooks: z.array(z.object({
            hook: z.string().describe('The scroll-stopping opening line.'),
            bridge: z.string().describe('A 1-sentence transition (max 15 words) that connects THIS specific hook to the main body smoothly.'),
            hook_type: z.enum(['question', 'statement', 'story', 'statistic']).describe('The psychological trigger type'),
        })).length(3).describe('3 distinct hooks with different types'),
        script_content: z.array(z.object({
            text: z.string().describe('A distinct beat/cut of the script. Keep it punchy (1-2 sentences max).'),
        })).min(4).max(6).describe('The core body of the script (excluding hook/bridge). 4-6 visual cuts.'),
        retention_tactic: z.string().describe('Specific retention strategy used'),
    })).length(3).describe('3 variations using the 3 core frameworks'),

    adjacent_topic_variations: z.array(z.object({
        pivot_type: z.string().describe('The pivot: "The Common Trap", "The Industry Secret", or "The Next Level"'),
        hooks: z.array(z.object({
            hook: z.string().describe('The scroll-stopping opening line.'),
            bridge: z.string().describe('A 1-sentence transition (max 15 words) connecting this hook to the body.'),
            hook_type: z.enum(['question', 'statement', 'story', 'statistic']).describe('The psychological trigger type'),
        })).length(3),
        script_content: z.array(z.object({
            text: z.string().describe('A distinct beat/cut (1-2 sentences).'),
        })).min(4).max(6),
        pivot_topic: z.string().describe('The specific adjacent topic'),
        structure_preserved: z.string().describe('Which structural element was kept'),
    })).length(3).describe('3 adjacent topic pivots'),
});

// IMPROVED SYSTEM PROMPT: Framework Enforcement + Bridge Law
const systemPrompt = `You are a Viral Script Architect specializing in short-form content optimization.

### CORE RULES:
1. **Bridge Law**: Every hook MUST have a unique bridge sentence that creates smooth narrative flow into the body.
2. **Framework Enforcement**: Use ONLY the 3 prescribed frameworks. No generic structures.
3. **Retention First**: Every sentence must justify its existence. Cut ruthlessly.
4. **Grade 5 Language**: No jargon, no fluff, no "In this video..." openers.
5. **Hook Type Diversity**: Across the 3 hooks, use different psychological triggers (question, statement, story, statistic).

### THE 3 FRAMEWORKS FOR SAME-TOPIC VARIATIONS:

**Framework A: The Myth Buster (Contrarian)**
- Hook: State a widely-held belief as a question or bold statement
- Bridge: Challenge it directly ("That's completely wrong." / "Here's why that fails." / "Let me show you the truth.")
- Body Structure: [Common Myth] → [Why it's wrong] → [The uncomfortable truth] → [Proof/Example]
- Tone: Confident, slightly contrarian, authoritative
- Example Flow:
  * Hook: "Does eating fat make you fat?"
  * Bridge: "That's the biggest nutrition lie of the century."
  * Body: Cut 1: "For 40 years, we've been told fat is the enemy..." etc.

**Framework B: The Negative Case Study (Warning)**
- Hook: Personal story of failure OR common mistake
- Bridge: Connect the mistake to the audience's pain ("And you're probably making the same mistake." / "This cost me everything." / "Here's what I learned.")
- Body Structure: [The mistake] → [Why it happens] → [The cost/consequence] → [The fix/lesson]
- Tone: Vulnerable but educational, cautionary
- Example Flow:
  * Hook: "I lost $5,000 in my first month of trading."
  * Bridge: "And it was entirely preventable."
  * Body: Cut 1: "I thought I could outsmart the market..." etc.

**Framework C: The X vs Y Comparison (Solution-Oriented)**
- Hook: Present the old/painful way OR the problem
- Bridge: Introduce the alternative ("But there's a better way." / "Here's what actually works." / "Let me show you the difference.")
- Body Structure: [Old way problems] → [New way benefits] → [How to switch] → [Expected results]
- Tone: Solution-oriented, fast-paced, actionable
- Example Flow:
  * Hook: "Stop using a to-do list."
  * Bridge: "Here's what high performers do instead."
  * Body: Cut 1: "To-do lists create decision fatigue..." etc.

### THE 3 PIVOTS FOR ADJACENT-TOPIC VARIATIONS:

**Pivot A: The Common Trap**
- What mistake comes AFTER the original topic's success?
- Example: Original = "How to get clients" → Pivot = "Why most new clients ghost you"

**Pivot B: The Industry Secret**
- What underrated tool/hack relates to this topic?
- Example: Original = "Email marketing" → Pivot = "The subject line formula nobody talks about"

**Pivot C: The Next Level**
- What's the advanced move after mastering the original topic?
- Example: Original = "Basic SEO" → Pivot = "How to rank without backlinks"

### OUTPUT REQUIREMENTS:
- Each script segment = 1 distinct beat/cut (max 2 sentences)
- No paragraphs, no AI fluff words (unleash, master, delve, landscape, game-changer, leverage)
- Use contractions (it's, don't, can't) - this is spoken content
- Bridges must be 1 sentence, max 15 words
- Framework rationale must be 1 sentence, max 20 words
- Hook types must vary across the 3 options (don't use 3 questions in a row)

### BRIDGE EXAMPLES (Critical):
❌ BAD (Generic bridge that works for any hook):
  Hook: "Stop drinking coffee."
  Bridge: "Here's why."
  
✅ GOOD (Specific bridge tailored to THIS hook):
  Hook: "Stop drinking coffee."
  Bridge: "It's destroying your sleep quality in ways you don't realize."

❌ BAD (Too long):
  Bridge: "And this is something that I discovered after years of research and experimentation with different approaches."

✅ GOOD (Concise):
  Bridge: "And the results shocked me."

Analyze the input content, extract its viral DNA, and rebuild it using these frameworks.`;

// Quality validation function
function validateScriptQuality(result: any): { passed: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check same topic variations
    result.same_topic_variations?.forEach((variation: any, vIndex: number) => {
        // Check framework rationale length
        const rationaleWords = variation.framework_rationale?.split(' ').length || 0;
        if (rationaleWords > 25) {
            issues.push(`Same-topic variation ${vIndex + 1}: Framework rationale too long (${rationaleWords} words, max 25)`);
        }

        // Check hooks
        variation.hooks?.forEach((hookObj: any, hIndex: number) => {
            // Check bridge length
            const bridgeWords = hookObj.bridge?.split(' ').length || 0;
            if (bridgeWords > 20) {
                issues.push(`Same-topic variation ${vIndex + 1}, hook ${hIndex + 1}: Bridge too long (${bridgeWords} words, max 20)`);
            }

            // Check for AI fluff in bridge
            const fluffPhrases = ['in this video', 'today i want to', 'let me show you how', 'here is why', "let's dive in"];
            const bridgeLower = hookObj.bridge?.toLowerCase() || '';
            fluffPhrases.forEach(phrase => {
                if (bridgeLower.includes(phrase)) {
                    issues.push(`Same-topic variation ${vIndex + 1}, hook ${hIndex + 1}: Bridge contains fluff phrase "${phrase}"`);
                }
            });
        });

        // Check for hook type diversity
        const hookTypes = variation.hooks?.map((h: any) => h.hook_type) || [];
        const uniqueTypes = new Set(hookTypes);
        if (uniqueTypes.size === 1) {
            issues.push(`Same-topic variation ${vIndex + 1}: All hooks use the same type (${hookTypes[0]}). Need diversity.`);
        }
    });

    // Check adjacent topic variations
    result.adjacent_topic_variations?.forEach((variation: any, vIndex: number) => {
        variation.hooks?.forEach((hookObj: any, hIndex: number) => {
            const bridgeWords = hookObj.bridge?.split(' ').length || 0;
            if (bridgeWords > 20) {
                issues.push(`Adjacent-topic variation ${vIndex + 1}, hook ${hIndex + 1}: Bridge too long (${bridgeWords} words)`);
            }
        });
    });

    return { passed: issues.length === 0, issues };
}

export async function POST(request: NextRequest) {
    try {
        const { content, inputType = 'script' } = await request.json();

        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
        }

        const userPrompt = `Analyze this ${inputType} and generate 3 Structural Variations using the prescribed frameworks (Myth Buster, Negative Case Study, X vs Y Comparison):
        
        INPUT CONTENT:
        """
        ${content}
        """
        
        Remember: Each hook needs its own unique bridge that flows naturally into the body content.
        `;

        const result = await generateObject({
            model: openai('gpt-4o'),
            schema: analysisSchema,
            system: systemPrompt,
            prompt: userPrompt,
        });

        // Validate quality
        const validation = validateScriptQuality(result.object);
        if (!validation.passed) {
            console.warn('⚠️  Quality validation warnings:', validation.issues);
            // Log but don't block - we still return the result
        }

        return NextResponse.json(result.object);
    } catch (error) {
        console.error('Optimization error:', error);
        return NextResponse.json(
            { error: 'Failed to generate optimizations' },
            { status: 500 }
        );
    }
}
