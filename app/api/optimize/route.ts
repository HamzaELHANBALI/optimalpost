import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// Platform types
type Platform = 'tiktok' | 'twitter';

// Analyze input structure to determine segment count for shape matching
function analyzeInputStructure(content: string): { segmentCount: number; minSegments: number; maxSegments: number } {
    // Split by newlines (lists) OR sentence endings (narrative)
    const segments = content
        .split(/\n+|(?<=[.!?])\s+(?=[A-Z])/)
        .map(s => s.trim())
        .filter(s => s.length >= 5); // Lower threshold to catch list headers like "Frontend:"

    const segmentCount = Math.max(3, segments.length); // At least 3 segments
    return {
        segmentCount,
        minSegments: Math.max(2, Math.floor(segmentCount * 0.8)),
        maxSegments: Math.max(4, Math.ceil(segmentCount * 1.5)), // Allow more expansion for lists
    };
}

// ENHANCED SCHEMA: Bridge Logic + Framework Metadata + Hook Types
// Content classification schema for framework recommendations
const classificationSchema = z.object({
    content_type: z.enum(['tutorial', 'story', 'opinion', 'breakdown', 'general']).describe('The type of content'),
    recommended_frameworks: z.array(z.string()).describe('2-3 frameworks that work best for this content type'),
    classification_reason: z.string().describe('Brief reason for this classification (1 sentence)'),
});

const analysisSchema = (minSegments: number, maxSegments: number, platform: Platform) => {
    // Different descriptions based on platform
    const hashtagsDesc = platform === 'tiktok'
        ? '5 TikTok-relevant hashtags (include # symbol). Mix trending + niche + topic-specific.'
        : 'Optional hashtags (leave empty array for Twitter).';
    const videoTitleDesc = platform === 'tiktok'
        ? 'Short catchy TikTok video title/caption (1-2 lines, max 100 chars). Creates curiosity or FOMO.'
        : 'Engaging tweet text (max 280 chars). Creates curiosity or sparks debate.';

    return z.object({
        analysis: z.object({
            hook: z.string().describe('The specific hook used in the original'),
            structure: z.string().describe('The narrative arc'),
            retention_mechanics: z.string().describe('Psychological triggers used'),
            niche_and_audience: z.string().describe('Target audience definition'),
            topic_angle: z.string().describe('The specific angle taken'),
            emotional_driver: z.string().describe('Core emotion'),
        }),

        same_topic_variations: z.array(z.object({
            framework: z.string().describe('The Viral Framework used: "The Myth Buster", "The Negative Case Study", "The X vs Y", or "The Direct Breakdown"'),
            framework_rationale: z.string().describe('Why this framework works for this topic (1 sentence, max 20 words)'),
            hooks: z.array(z.object({
                hook: z.string().describe('The scroll-stopping opening line.'),
                bridge: z.string().describe('A 1-sentence transition (max 15 words) that connects THIS specific hook to the main body smoothly.'),
                hook_type: z.enum(['question', 'statement', 'story', 'statistic']).describe('The psychological trigger type'),
            })).length(3).describe('3 distinct hooks with different types'),
            script_content: z.array(z.object({
                text: z.string().describe('A distinct beat/segment of the script matching the input structure.'),
            })).min(minSegments).max(maxSegments).describe(`${minSegments}-${maxSegments} segments matching the input script shape.`),
            retention_tactic: z.string().describe('Specific retention strategy used'),
            hashtags: z.array(z.string()).describe(hashtagsDesc),
            video_title: z.string().describe(videoTitleDesc),
        })).length(3).describe('3 variations using the 3 core frameworks'),

        adjacent_topic_variations: z.array(z.object({
            pivot_type: z.string().describe('The pivot: "The Common Trap", "The Industry Secret", or "The Next Level"'),
            hooks: z.array(z.object({
                hook: z.string().describe('The scroll-stopping opening line.'),
                bridge: z.string().describe('A 1-sentence transition (max 15 words) connecting this hook to the body.'),
                hook_type: z.enum(['question', 'statement', 'story', 'statistic']).describe('The psychological trigger type'),
            })).length(3),
            script_content: z.array(z.object({
                text: z.string().describe('A distinct beat/segment matching the input structure.'),
            })).min(minSegments).max(maxSegments),
            pivot_topic: z.string().describe('The specific adjacent topic'),
            structure_preserved: z.string().describe('Which structural element was kept'),
            hashtags: z.array(z.string()).describe(hashtagsDesc),
            video_title: z.string().describe(videoTitleDesc),
        })).length(3).describe('3 adjacent topic pivots'),
    });
};

// IMPROVED SYSTEM PROMPT: Framework Enforcement + Bridge Law
const systemPrompt = `You are a Viral Script Architect specializing in short-form content optimization.

### CORE RULES:
1. **Bridge Law**: Every hook MUST have a unique bridge sentence that creates smooth narrative flow into the body.
2. **Framework Matching**: Select the single best framework for the content type:
   - Use "The Direct Breakdown" for lists, tech stacks, step-by-step guides
   - Use "The Myth Buster" for contrarian takes and opinion content
   - Use "The Negative Case Study" for cautionary stories and warnings
   - Use "The X vs Y" for tutorials comparing approaches
3. **Retention First**: Every sentence must justify its existence. Cut ruthlessly.
4. **Grade 5 Language**: No jargon, no fluff, no "In this video..." openers.
5. **Hook Type Diversity**: Across the 3 hooks, use different psychological triggers (question, statement, story, statistic).

### THE 4 FRAMEWORKS FOR SAME-TOPIC VARIATIONS:

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

**Framework D: The Direct Breakdown (Educational/List)**
- Best for: Tech stacks, recipes, step-by-step guides, "Top 3" lists, feature breakdowns
- Hook: A clear promise of value or "The [Quality] to [Result]"
- Bridge: A quick qualifier ("It's simpler than you think." / "Steal this exact setup." / "Screenshot this.")
- Body Structure: [Item 1] → [Item 2] → [Item 3] → [Summary/Outcome]
- Tone: Punchy, expert, no-nonsense, fast-paced. No fake drama.
- Example Flow:
  * Hook: "Stop overcomplicating your tech stack."
  * Bridge: "Here's the only setup you need to ship fast."
  * Body: Cut 1: "Frontend: Next.js for speed..." Cut 2: "Backend: Supabase for scale..." etc.

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
- **NEVER repeat the hook or bridge in script_content** - the body must be NEW content that follows from the bridge

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

**For Framework D (Direct Breakdown):**
✅ GOOD: "Here's the exact list."
✅ GOOD: "Screenshot this."
✅ GOOD: "Steal this setup."
❌ BAD: "Let me explain to you exactly why these items are chosen for this specific purpose."

### TIKTOK HASHTAGS & VIDEO TITLE:

**Hashtags (5 per script):**
- Include 1-2 trending hashtags: #fyp, #foryou, #viral, #foryoupage
- Include 2-3 niche-specific hashtags based on the topic
- Always include the # symbol
- Keep them lowercase, no spaces

**Video Title:**
- Max 100 characters
- Create curiosity or FOMO (Fear Of Missing Out)
- Use emojis sparingly (1-2 max)
- Examples: "POV: you finally learn the truth 👀", "This changed everything for me"
- No clickbait without payoff

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
        const { content, inputType = 'script', platform = 'tiktok' } = await request.json();

        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
        }

        // Validate platform
        const validPlatforms: Platform[] = ['tiktok', 'twitter'];
        const selectedPlatform: Platform = validPlatforms.includes(platform) ? platform : 'tiktok';

        // Analyze input structure for shape matching
        const inputStructure = analyzeInputStructure(content);
        console.log(`📊 Input structure: ${inputStructure.segmentCount} segments (range: ${inputStructure.minSegments}-${inputStructure.maxSegments})`);

        // Build dynamic schema based on input structure and platform
        const dynamicSchema = analysisSchema(inputStructure.minSegments, inputStructure.maxSegments, selectedPlatform);

        // Classification prompt (runs with cheaper model)
        const classificationPrompt = `Classify this content and recommend which viral frameworks would work best:

Content: "${content.slice(0, 500)}${content.length > 500 ? '...' : ''}"

Content Types:
- tutorial: How-to content, step-by-step guides, educational
- story: Personal narratives, case studies, experiences  
- opinion: Contrarian takes, hot takes, controversial views
- breakdown: Lists, tech stacks, ingredient lists, feature lists, itemized content
- general: Mixed content, informational

Framework Options:
- "The Myth Buster": Best for opinion/contrarian content
- "The Negative Case Study": Best for story-based warnings
- "The X vs Y": Best for tutorials comparing approaches
- "The Direct Breakdown": Best for lists, stacks, and itemized content
- "The Common Trap": Best for follow-up warnings
- "The Industry Secret": Best for insider tips
- "The Next Level": Best for advanced tutorials`;

        // Platform-specific instructions
        const platformInstructions = selectedPlatform === 'tiktok'
            ? 'Generate 5 trending TikTok hashtags and a catchy video caption for each variation.'
            : 'Generate an engaging tweet text (max 280 chars) for each variation. Leave hashtags empty.';

        const userPrompt = `Analyze this ${inputType} and generate 3 Structural Variations using the prescribed frameworks (Myth Buster, Negative Case Study, X vs Y, or Direct Breakdown):
        
**CRITICAL - SHAPE MATCHING:**
The input has approximately ${inputStructure.segmentCount} natural segments/beats.
Your output script_content MUST have ${inputStructure.minSegments}-${inputStructure.maxSegments} segments.
Match the pacing and rhythm of the original. Do NOT condense or expand excessively.

**Platform: ${selectedPlatform.toUpperCase()}**
${platformInstructions}
        
INPUT CONTENT:
"""
${content}
"""
        
Remember: Each hook needs its own unique bridge that flows naturally into the body content.
        `;

        // Run classification and main generation in parallel for speed
        const [classificationResult, analysisResult] = await Promise.all([
            generateObject({
                model: openai('gpt-4o-mini'), // Cheaper model for classification
                schema: classificationSchema,
                prompt: classificationPrompt,
            }),
            generateObject({
                model: openai('gpt-4o'),
                schema: dynamicSchema,
                system: systemPrompt,
                prompt: userPrompt,
            }),
        ]);

        // Validate quality
        const validation = validateScriptQuality(analysisResult.object);
        if (!validation.passed) {
            console.warn('⚠️  Quality validation warnings:', validation.issues);
        }

        // Return combined result with classification and platform info
        return NextResponse.json({
            classification: classificationResult.object,
            platform: selectedPlatform,
            inputSegments: inputStructure.segmentCount,
            ...analysisResult.object,
        });
    } catch (error) {
        console.error('Optimization error:', error);
        return NextResponse.json(
            { error: 'Failed to generate optimizations' },
            { status: 500 }
        );
    }
}
