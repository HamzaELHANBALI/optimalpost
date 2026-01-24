import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// Platform types
type Platform = 'tiktok' | 'twitter';

// Platform-specific configuration
const platformConfig = {
    tiktok: {
        hashtagCount: 5,
        titleMaxChars: 100,
        toneAdjustment: 'energetic and youthful - use casual language, emojis sparingly, create FOMO',
        pacing: 'fast-paced - new visual or idea every 2-3 seconds, hook in first 1 second',
        exampleHashtags: ['#fyp', '#foryou', '#viral', '#LearnOnTikTok'],
    },
    twitter: {
        hashtagCount: 0,
        titleMaxChars: 280,
        toneAdjustment: 'provocative and debate-sparking - make bold claims, challenge assumptions',
        pacing: 'punchy - deliver the core idea in first tweet, expand if needed',
        exampleHashtags: [],
    },
};

// Enhanced input structure analysis
interface InputStructure {
    segmentCount: number;
    minSegments: number;
    maxSegments: number;
    hasNumericList: boolean;
    hasBulletPoints: boolean;
    narrativeType: 'list' | 'story' | 'hybrid';
    toneMarkers: string[];
    avgWordsPerSegment: number;
}

function analyzeInputStructure(content: string): InputStructure {
    const lines = content.split('\n').filter(s => s.trim());

    // Detect list patterns
    const hasNumericList = /^\d+[\.\)]\s/m.test(content);
    const hasBulletPoints = /^[\-\*•]\s/m.test(content);

    // Calculate average words per line for narrative detection
    const avgWordsPerLine = lines.length > 0
        ? lines.reduce((sum, line) => sum + line.split(/\s+/).length, 0) / lines.length
        : 0;

    const narrativeType: 'list' | 'story' | 'hybrid' =
        avgWordsPerLine > 15 ? 'story' :
            (hasNumericList || hasBulletPoints) ? 'list' : 'hybrid';

    // Extract tone markers
    const toneMarkers: string[] = [];
    if (/\?/m.test(content)) toneMarkers.push('questioning');
    if (/!/m.test(content)) toneMarkers.push('emphatic');
    if (/\b(I|my|me|we|our)\b/i.test(content)) toneMarkers.push('personal');
    if (/\b(never|stop|always|worst|best|don't)\b/i.test(content)) toneMarkers.push('strong-opinion');
    if (/\b(failed|mistake|lost|wrong|disaster)\b/i.test(content)) toneMarkers.push('cautionary');

    // Smarter segmentation
    const segments = content
        .split(/\n+|(?<=[.!?])\s+(?=[A-Z])/g)
        .map(s => s.trim())
        .filter(s => s.length >= 5);

    const segmentCount = Math.max(3, segments.length);
    const avgWordsPerSegment = segments.length > 0
        ? segments.reduce((sum, seg) => sum + seg.split(/\s+/).length, 0) / segments.length
        : 0;

    return {
        segmentCount,
        minSegments: Math.max(2, Math.floor(segmentCount * 0.75)),
        maxSegments: Math.ceil(segmentCount * 1.3),
        hasNumericList,
        hasBulletPoints,
        narrativeType,
        toneMarkers,
        avgWordsPerSegment,
    };
}

// Automatic framework selection
function selectOptimalFrameworks(
    content: string,
    classification: any,
    inputStructure: InputStructure
): { primary: string; alternatives: string[]; reasoning: string } {
    const frameworks = {
        'The Direct Breakdown': 0,
        'The Myth Buster': 0,
        'The Negative Case Study': 0,
        'The X vs Y': 0,
    };

    const reasons: string[] = [];

    // Score based on content type
    if (classification.content_type === 'breakdown' || inputStructure.hasNumericList) {
        frameworks['The Direct Breakdown'] += 3;
        reasons.push('Detected list/breakdown structure');
    }
    if (classification.content_type === 'opinion') {
        frameworks['The Myth Buster'] += 3;
        reasons.push('Detected opinion/contrarian content');
    }
    if (classification.content_type === 'story' || inputStructure.toneMarkers.includes('cautionary')) {
        frameworks['The Negative Case Study'] += 3;
        reasons.push('Detected narrative/cautionary story');
    }
    if (classification.content_type === 'tutorial' || /\bvs\b|\binstead\b|\bbetter than\b/i.test(content)) {
        frameworks['The X vs Y'] += 3;
        reasons.push('Detected comparison/tutorial structure');
    }

    // Score based on tone markers
    if (inputStructure.toneMarkers.includes('questioning')) {
        frameworks['The Myth Buster'] += 1;
    }
    if (inputStructure.toneMarkers.includes('personal') || inputStructure.toneMarkers.includes('cautionary')) {
        frameworks['The Negative Case Study'] += 2;
    }
    if (inputStructure.toneMarkers.includes('strong-opinion')) {
        frameworks['The Myth Buster'] += 1;
    }

    // Score based on narrative type
    if (inputStructure.narrativeType === 'list') {
        frameworks['The Direct Breakdown'] += 2;
    } else if (inputStructure.narrativeType === 'story') {
        frameworks['The Negative Case Study'] += 1;
    }

    // Sort and select top 3
    const sorted = Object.entries(frameworks)
        .sort(([, a], [, b]) => b - a);

    return {
        primary: sorted[0][0],
        alternatives: sorted.slice(1, 3).map(([name]) => name),
        reasoning: reasons.join('; '),
    };
}

// Bridge specificity validation
interface BridgeValidation {
    isSpecific: boolean;
    score: number;
    reason: string;
}

function validateBridgeSpecificity(hook: string, bridge: string): BridgeValidation {
    // Generic phrases that indicate lazy bridging
    const genericPhrases = [
        'here\'s why', 'let me explain', 'here\'s how',
        'and here\'s the thing', 'here\'s what', 'this is important',
        'let me tell you', 'let me show you how', 'in this video',
    ];

    const bridgeLower = bridge.toLowerCase();
    const isGeneric = genericPhrases.some(phrase => bridgeLower.includes(phrase));

    // Extract key nouns/topics from hook
    const hookWords = hook.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3 && !['this', 'that', 'these', 'those', 'what', 'when', 'where'].includes(w));

    // Check if bridge references hook-specific content
    const hasSpecificReference = hookWords.some(word => {
        const wordRoot = word.slice(0, -1); // Handle plurals
        return bridgeLower.includes(word) || bridgeLower.includes(wordRoot);
    });

    let score = 0;
    const reasons: string[] = [];

    if (isGeneric) {
        score -= 2;
        reasons.push('Too generic - could apply to any hook');
    }
    if (hasSpecificReference) {
        score += 2;
        reasons.push('References hook-specific content');
    }

    const wordCount = bridge.split(/\s+/).length;
    if (wordCount <= 10) {
        score += 1;
        reasons.push('Concise length');
    } else if (wordCount > 15) {
        score -= 1;
        reasons.push('Too long');
    }

    // Bonus for strong connectors
    if (/\b(that's|but|and it|this)\b/i.test(bridge)) {
        score += 1;
    }

    return {
        isSpecific: score > 0,
        score,
        reason: reasons.join('; '),
    };
}

// Engagement potential scoring
interface EngagementScore {
    totalScore: number;
    breakdown: {
        hookStrength: number;
        bridgeSpecificity: number;
        contentPacing: number;
        emotionalImpact: number;
        structuralClarity: number;
    };
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    improvements: string[];
}

function scoreEngagementPotential(variation: any): EngagementScore {
    const scores = {
        hookStrength: 0,
        bridgeSpecificity: 0,
        contentPacing: 0,
        emotionalImpact: 0,
        structuralClarity: 0,
    };

    const improvements: string[] = [];

    // Score hook strength (0-5 points)
    const firstHook = variation.hooks?.[0]?.hook || '';
    if (/\d+/.test(firstHook)) scores.hookStrength += 2;
    if (/\?$/.test(firstHook)) scores.hookStrength += 1;
    if (/\b(never|stop|always|worst|best|secret|truth)\b/i.test(firstHook)) scores.hookStrength += 2;
    if (firstHook.length < 60) scores.hookStrength += 1; // Punchy hooks

    if (scores.hookStrength < 3) {
        improvements.push('Hook could be stronger - add numbers, questions, or bold claims');
    }

    // Score bridge specificity (0-5 points)
    const bridges = variation.hooks?.map((h: any) => h.bridge) || [];
    const avgBridgeWords = bridges.length > 0
        ? bridges.reduce((sum: number, b: string) => sum + b.split(/\s+/).length, 0) / bridges.length
        : 0;

    if (avgBridgeWords <= 10) scores.bridgeSpecificity += 3;
    else if (avgBridgeWords <= 15) scores.bridgeSpecificity += 2;
    else improvements.push('Bridges too long - aim for under 10 words');

    // Check for generic bridges
    const hasGeneric = bridges.some((b: string) =>
        /here's why|let me|here's what/i.test(b)
    );
    if (!hasGeneric) scores.bridgeSpecificity += 2;
    else improvements.push('Avoid generic bridge phrases like "here\'s why"');

    // Score content pacing (0-5 points)
    const segments = variation.script_content || [];
    const avgSegmentWords = segments.length > 0
        ? segments.reduce((sum: number, seg: any) => sum + seg.text.split(/\s+/).length, 0) / segments.length
        : 0;

    if (avgSegmentWords <= 15) scores.contentPacing += 3;
    else if (avgSegmentWords <= 25) scores.contentPacing += 2;
    else if (avgSegmentWords <= 35) scores.contentPacing += 1;
    else improvements.push('Segments too long - break into shorter beats for retention');

    // Bonus for varied segment lengths (dynamic pacing)
    const segmentLengths = segments.map((s: any) => s.text.split(/\s+/).length);
    const variance = segmentLengths.length > 1
        ? Math.sqrt(segmentLengths.reduce((sum: number, len: number) =>
            sum + Math.pow(len - avgSegmentWords, 2), 0) / segmentLengths.length)
        : 0;
    if (variance > 5) scores.contentPacing += 1;

    // Score emotional impact (0-5 points)
    const emotionalWords = [
        'shocking', 'devastated', 'thrilled', 'terrified', 'obsessed',
        'insane', 'crazy', 'unbelievable', 'disaster', 'breakthrough',
        'destroyed', 'transformed', 'failed', 'crushed', 'exploded'
    ];
    const bodyText = segments.map((s: any) => s.text).join(' ').toLowerCase();
    const emotionalHits = emotionalWords.filter(w => bodyText.includes(w)).length;
    scores.emotionalImpact = Math.min(5, emotionalHits * 1.5);

    if (scores.emotionalImpact < 2) {
        improvements.push('Add more emotional language to create impact');
    }

    // Score structural clarity (0-5 points)
    const hasFramework = variation.framework || variation.pivot_type;
    if (hasFramework) scores.structuralClarity += 2;

    const hasRetentionTactic = variation.retention_tactic;
    if (hasRetentionTactic) scores.structuralClarity += 2;

    // Check for hook type diversity
    const hookTypes = variation.hooks?.map((h: any) => h.hook_type) || [];
    const uniqueTypes = new Set(hookTypes);
    if (uniqueTypes.size >= 2) scores.structuralClarity += 1;
    else if (hookTypes.length >= 3) improvements.push('Use different hook types for variety');

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);

    // Grade calculation (out of 25 points)
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (totalScore >= 20) grade = 'A';
    else if (totalScore >= 16) grade = 'B';
    else if (totalScore >= 12) grade = 'C';
    else if (totalScore >= 8) grade = 'D';
    else grade = 'F';

    return {
        totalScore,
        breakdown: scores,
        grade,
        improvements,
    };
}

// Content classification schema
const classificationSchema = z.object({
    content_type: z.enum(['tutorial', 'story', 'opinion', 'breakdown', 'general']).describe('The type of content'),
    recommended_frameworks: z.array(z.string()).describe('2-3 frameworks that work best for this content type'),
    classification_reason: z.string().describe('Brief reason for this classification (1 sentence)'),
});

// Dynamic analysis schema
const analysisSchema = (minSegments: number, maxSegments: number, platform: Platform) => {
    const config = platformConfig[platform];

    const hashtagsDesc = platform === 'tiktok'
        ? `Exactly ${config.hashtagCount} TikTok-relevant hashtags (include # symbol). Mix trending + niche + topic-specific.`
        : 'Empty array for Twitter (no hashtags needed).';

    const videoTitleDesc = platform === 'tiktok'
        ? `Short catchy TikTok video title/caption (max ${config.titleMaxChars} chars). Creates curiosity or FOMO.`
        : `Engaging tweet text (max ${config.titleMaxChars} chars). Creates curiosity or sparks debate.`;

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

// Enhanced system prompt
const systemPrompt = `You are a Viral Script Architect specializing in short-form content optimization.

### CORE RULES:
1. **Bridge Law**: Every hook MUST have a unique bridge sentence that creates smooth narrative flow into the body.
2. **Framework Matching**: Select the single best framework for the content type.
3. **Retention First**: Every sentence must justify its existence. Cut ruthlessly.
4. **Grade 5 Language**: No jargon, no fluff, no "In this video..." openers.
5. **Hook Type Diversity**: Across the 3 hooks, use different psychological triggers (question, statement, story, statistic).

### THE 4 FRAMEWORKS FOR SAME-TOPIC VARIATIONS:

**Framework A: The Myth Buster (Contrarian)**
- Hook: State a widely-held belief as a question or bold statement
- Bridge: Challenge it directly
- Body Structure: [Common Myth] → [Why it's wrong] → [The uncomfortable truth] → [Proof/Example]
- Tone: Confident, slightly contrarian, authoritative

Example 1:
  Hook: "Does eating fat make you fat?"
  Bridge: "That's the biggest nutrition lie of the century."  ✅ (Specific, contrarian, 7 words)
  Body Cut 1: "For 40 years, we blamed fat for obesity."
  Body Cut 2: "But sugar was the real culprit all along."
  Body Cut 3: "Your brain is 60% fat and needs it to function."

Example 2:
  Hook: "Everyone says you need 8 hours of sleep."
  Bridge: "That's completely backwards for high performers."  ✅ (Bold challenge, 6 words)
  Body Cut 1: "Elite athletes sleep 6 hours max."
  Body Cut 2: "Quality beats quantity every single time."

**Framework B: The Negative Case Study (Warning)**
- Hook: Personal story of failure OR common mistake
- Bridge: Connect the mistake to the audience's pain
- Body Structure: [The mistake] → [Why it happens] → [The cost/consequence] → [The fix/lesson]
- Tone: Vulnerable but educational, cautionary

Example 1:
  Hook: "I lost $5,000 in my first month of trading."
  Bridge: "And it was 100% preventable."  ✅ (Specific consequence + intrigue, 5 words)
  Body Cut 1: "I thought I could outsmart the market."
  Body Cut 2: "I ignored every risk management rule."
  Body Cut 3: "One bad day wiped out 3 months of gains."

Example 2:
  Hook: "My startup failed after raising $500K."
  Bridge: "Because I built something nobody wanted."  ✅ (Direct cause, 6 words)
  Body Cut 1: "I spent 8 months on features users never asked for."
  Body Cut 2: "Zero customer interviews, zero validation."

**Framework C: The X vs Y Comparison (Solution-Oriented)**
- Hook: Present the old/painful way OR the problem
- Bridge: Introduce the alternative
- Body Structure: [Old way problems] → [New way benefits] → [How to switch] → [Expected results]
- Tone: Solution-oriented, fast-paced, actionable

Example 1:
  Hook: "Stop using a to-do list."
  Bridge: "Here's what high performers do instead."  ✅ (Promise of alternative, 6 words)
  Body Cut 1: "To-do lists create decision fatigue."
  Body Cut 2: "Time blocking removes all the guesswork."
  Body Cut 3: "You'll finish 3x more in half the time."

Example 2:
  Hook: "You're journaling wrong."
  Bridge: "This method is 10x more effective."  ✅ (Quantified benefit, 6 words)
  Body Cut 1: "Random thoughts don't create clarity."
  Body Cut 2: "Answer the same 3 questions daily instead."

**Framework D: The Direct Breakdown (Educational/List)**
- Best for: Tech stacks, recipes, step-by-step guides, "Top 3" lists, feature breakdowns
- Hook: A clear promise of value or "The [Quality] to [Result]"
- Bridge: A quick qualifier
- Body Structure: [Item 1] → [Item 2] → [Item 3] → [Summary/Outcome]
- Tone: Punchy, expert, no-nonsense, fast-paced. No fake drama.

Example 1:
  Hook: "My tech stack that shipped 3 apps in 30 days."
  Bridge: "Copy this exact setup."  ✅ (Specific, actionable, 4 words)
  Body Cut 1: "Frontend: Next.js with server components."
  Body Cut 2: "Backend: Supabase for auth and database."
  Body Cut 3: "Deployment: Vercel for instant shipping."

Example 2:
  Hook: "Stop overcomplicating your morning routine."
  Bridge: "These 3 habits changed everything."  ✅ (Promise + specificity, 5 words)
  Body Cut 1: "5 AM: Cold shower to activate dopamine."
  Body Cut 2: "5:15: 10 minutes of sunlight exposure."
  Body Cut 3: "5:30: Protein-heavy breakfast, no carbs."

### CRITICAL: BRIDGE SPECIFICITY TEST
Ask yourself: "Could this bridge work for a completely different hook?"
- If YES → Rewrite to be more specific
- If NO → You've nailed it

**ANTI-PATTERNS TO AVOID:**
❌ Hook: "Stop drinking coffee"
   Bridge: "Here's why."  (Too generic - applies to any hook)

❌ Hook: "I lost $5,000 trading"
   Bridge: "Let me tell you about it."  (Redundant - we know you'll tell us)

❌ Hook: "My best productivity hack"
   Bridge: "This will change your life forever and make you incredibly successful."  (Too long, 11 words)

✅ Hook: "Stop drinking coffee"
   Bridge: "It's destroying your sleep quality."  (Specific to coffee's effects, 5 words)

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
- Each script segment = 1 distinct beat/cut (max 2 sentences, ideally 1)
- No paragraphs, no AI fluff words (unleash, master, delve, landscape, game-changer, leverage)
- Use contractions (it's, don't, can't) - this is spoken content
- Bridges must be 1 sentence, max 15 words, ideally under 10 words
- Framework rationale must be 1 sentence, max 20 words
- Hook types must vary across the 3 options (don't use 3 questions in a row)
- **NEVER repeat the hook or bridge in script_content** - the body must be NEW content that follows from the bridge
- Make bridges SPECIFIC to their hooks - avoid "Here's why" / "Let me explain" / "Here's what"

Analyze the input content, extract its viral DNA, and rebuild it using these frameworks.`;

// Quality validation with detailed feedback
interface ValidationResult {
    passed: boolean;
    issues: string[];
    bridgeScores: Array<{ variation: number; hook: number; validation: BridgeValidation }>;
}

function validateScriptQuality(result: any): ValidationResult {
    const issues: string[] = [];
    const bridgeScores: Array<{ variation: number; hook: number; validation: BridgeValidation }> = [];

    // Check same topic variations
    result.same_topic_variations?.forEach((variation: any, vIndex: number) => {
        // Check framework rationale length
        const rationaleWords = variation.framework_rationale?.split(/\s+/).length || 0;
        if (rationaleWords > 25) {
            issues.push(`Same-topic variation ${vIndex + 1}: Framework rationale too long (${rationaleWords} words, max 25)`);
        }

        // Check hooks
        variation.hooks?.forEach((hookObj: any, hIndex: number) => {
            // Check bridge length
            const bridgeWords = hookObj.bridge?.split(/\s+/).length || 0;
            if (bridgeWords > 20) {
                issues.push(`Same-topic variation ${vIndex + 1}, hook ${hIndex + 1}: Bridge too long (${bridgeWords} words, max 20)`);
            }

            // Validate bridge specificity
            const bridgeValidation = validateBridgeSpecificity(hookObj.hook, hookObj.bridge);
            bridgeScores.push({
                variation: vIndex,
                hook: hIndex,
                validation: bridgeValidation,
            });

            if (!bridgeValidation.isSpecific) {
                issues.push(`Same-topic variation ${vIndex + 1}, hook ${hIndex + 1}: ${bridgeValidation.reason}`);
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
        if (uniqueTypes.size === 1 && hookTypes.length >= 3) {
            issues.push(`Same-topic variation ${vIndex + 1}: All hooks use the same type (${hookTypes[0]}). Need diversity.`);
        }

        // Check script content doesn't repeat hook or bridge
        const firstHook = variation.hooks?.[0]?.hook?.toLowerCase() || '';
        const firstBridge = variation.hooks?.[0]?.bridge?.toLowerCase() || '';
        variation.script_content?.forEach((segment: any, sIndex: number) => {
            const segmentText = segment.text?.toLowerCase() || '';
            if (segmentText.includes(firstHook.toLowerCase().slice(0, 20))) {
                issues.push(`Same-topic variation ${vIndex + 1}, segment ${sIndex + 1}: Appears to repeat hook text`);
            }
            if (firstBridge && segmentText.includes(firstBridge.toLowerCase())) {
                issues.push(`Same-topic variation ${vIndex + 1}, segment ${sIndex + 1}: Appears to repeat bridge text`);
            }
        });
    });

    // Check adjacent topic variations
    result.adjacent_topic_variations?.forEach((variation: any, vIndex: number) => {
        variation.hooks?.forEach((hookObj: any, hIndex: number) => {
            const bridgeWords = hookObj.bridge?.split(/\s+/).length || 0;
            if (bridgeWords > 20) {
                issues.push(`Adjacent-topic variation ${vIndex + 1}, hook ${hIndex + 1}: Bridge too long (${bridgeWords} words)`);
            }

            const bridgeValidation = validateBridgeSpecificity(hookObj.hook, hookObj.bridge);
            bridgeScores.push({
                variation: vIndex + 100, // Offset to distinguish from same-topic
                hook: hIndex,
                validation: bridgeValidation,
            });

            if (!bridgeValidation.isSpecific) {
                issues.push(`Adjacent-topic variation ${vIndex + 1}, hook ${hIndex + 1}: ${bridgeValidation.reason}`);
            }
        });
    });

    return { passed: issues.length === 0, issues, bridgeScores };
}

// Generate with validation and retry
async function generateWithValidation(
    model: any,
    schema: any,
    systemPrompt: string,
    userPrompt: string,
    maxRetries = 2
): Promise<{ result: any; validation: ValidationResult; attempt: number }> {
    let lastResult: any = null;
    let lastValidation: ValidationResult | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const result = await generateObject({
                model,
                schema,
                system: systemPrompt,
                prompt: userPrompt,
            });

            lastResult = result;
            const validation = validateScriptQuality(result.object);
            lastValidation = validation;

            if (validation.passed) {
                console.log(`✅ Validation passed on attempt ${attempt + 1}`);
                return { result, validation, attempt };
            }

            if (attempt < maxRetries) {
                console.warn(`⚠️  Attempt ${attempt + 1} failed validation. Retrying with feedback...`);
                console.warn('Issues:', validation.issues.slice(0, 5)); // Log first 5 issues

                // Add validation feedback to prompt for retry
                const feedbackSection = `

**CRITICAL VALIDATION ERRORS FROM PREVIOUS ATTEMPT:**
${validation.issues.slice(0, 10).map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

**YOU MUST FIX THESE ISSUES IN THIS ATTEMPT. Pay special attention to:**
- Bridge specificity (avoid "Here's why", "Let me explain")
- Bridge length (max 15 words, ideally under 10)
- Hook type diversity (use different types: question, statement, story, statistic)
- No repetition of hook or bridge in script_content
`;

                userPrompt += feedbackSection;
            } else {
                console.error('❌ Max retries reached. Returning with warnings.');
            }
        } catch (error) {
            console.error(`Error on attempt ${attempt + 1}:`, error);
            if (attempt === maxRetries) throw error;
        }
    }

    // Safety check: ensure we have a result
    if (!lastResult || !lastValidation) {
        throw new Error('All generation attempts failed without producing a result');
    }

    return { result: lastResult, validation: lastValidation, attempt: maxRetries };
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
        console.log(`📊 Input structure analysis:`, {
            segments: inputStructure.segmentCount,
            range: `${inputStructure.minSegments}-${inputStructure.maxSegments}`,
            type: inputStructure.narrativeType,
            toneMarkers: inputStructure.toneMarkers,
            avgWordsPerSegment: Math.round(inputStructure.avgWordsPerSegment),
        });

        // Build dynamic schema based on input structure and platform
        const dynamicSchema = analysisSchema(
            inputStructure.minSegments,
            inputStructure.maxSegments,
            selectedPlatform
        );

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

        // Run classification first
        const classificationResult = await generateObject({
            model: openai('gpt-4o-mini'),
            schema: classificationSchema,
            prompt: classificationPrompt,
        });

        console.log('🎯 Content classification:', classificationResult.object.content_type);

        // Select optimal frameworks based on classification and input structure
        const frameworkSelection = selectOptimalFrameworks(
            content,
            classificationResult.object,
            inputStructure
        );

        console.log('🎨 Framework selection:', {
            primary: frameworkSelection.primary,
            alternatives: frameworkSelection.alternatives,
            reasoning: frameworkSelection.reasoning,
        });

        // Get platform configuration
        const config = platformConfig[selectedPlatform];

        // Enhanced user prompt with platform-specific instructions
        const userPrompt = `Analyze this ${inputType} and generate 3 Structural Variations using the prescribed frameworks.

**PLATFORM: ${selectedPlatform.toUpperCase()}**
- Tone: ${config.toneAdjustment}
- Pacing: ${config.pacing}
- Hashtags: ${config.hashtagCount > 0 ? `Generate exactly ${config.hashtagCount} relevant hashtags` : 'No hashtags needed'}
- Title/Caption: Max ${config.titleMaxChars} characters

**CRITICAL - SHAPE MATCHING:**
The input has approximately ${inputStructure.segmentCount} natural segments/beats.
Your output script_content MUST have ${inputStructure.minSegments}-${inputStructure.maxSegments} segments.
Match the pacing and rhythm of the original. Do NOT condense or expand excessively.

**CONTENT ANALYSIS:**
- Type: ${classificationResult.object.content_type}
- Narrative type: ${inputStructure.narrativeType}
- Tone markers: ${inputStructure.toneMarkers.join(', ')}
- Average words per segment: ~${Math.round(inputStructure.avgWordsPerSegment)}

**RECOMMENDED FRAMEWORKS (prioritize these):**
1. Primary: ${frameworkSelection.primary}
2. ${frameworkSelection.alternatives[0]}
3. ${frameworkSelection.alternatives[1]}
Reasoning: ${frameworkSelection.reasoning}

**INPUT CONTENT:**
"""
${content}
"""

**CRITICAL REQUIREMENTS:**
1. Each hook needs its own UNIQUE, SPECIFIC bridge (max 15 words, ideally under 10)
2. Bridges must be tailored to the specific hook - NO generic phrases like "Here's why" or "Let me explain"
3. Use different hook types across the 3 hooks (question, statement, story, statistic)
4. Script content must NOT repeat the hook or bridge - start with new information
5. Match the segment count and pacing of the original content

Remember: Bridge specificity is critical. Test each bridge: "Could this work for any other hook?" If yes, make it more specific.`;

        // Generate with validation and retry
        const { result: analysisResult, validation, attempt } = await generateWithValidation(
            openai('gpt-4o'),
            dynamicSchema,
            systemPrompt,
            userPrompt,
            2 // Max 2 retries
        );

        // Calculate engagement scores for all variations
        const sameTopicScores = analysisResult.object.same_topic_variations?.map(
            (v: any) => scoreEngagementPotential(v)
        ) || [];

        const adjacentTopicScores = analysisResult.object.adjacent_topic_variations?.map(
            (v: any) => scoreEngagementPotential(v)
        ) || [];

        // Log quality metrics
        console.log('📈 Engagement scores:', {
            sameTopicAvg: sameTopicScores.reduce((sum: number, s: EngagementScore) =>
                sum + s.totalScore, 0) / (sameTopicScores.length || 1),
            adjacentTopicAvg: adjacentTopicScores.reduce((sum: number, s: EngagementScore) =>
                sum + s.totalScore, 0) / (adjacentTopicScores.length || 1),
            topGrade: sameTopicScores[0]?.grade || 'N/A',
        });

        if (!validation.passed) {
            console.warn(`⚠️  Final output has ${validation.issues.length} quality issues after ${attempt + 1} attempts`);
            console.warn('Sample issues:', validation.issues.slice(0, 3));
        } else {
            console.log(`✅ Perfect output generated on attempt ${attempt + 1}`);
        }

        // Return comprehensive result
        return NextResponse.json({
            classification: {
                ...classificationResult.object,
                framework_selection: frameworkSelection,
            },
            platform: selectedPlatform,
            inputStructure: {
                segmentCount: inputStructure.segmentCount,
                narrativeType: inputStructure.narrativeType,
                toneMarkers: inputStructure.toneMarkers,
                avgWordsPerSegment: Math.round(inputStructure.avgWordsPerSegment),
            },
            ...analysisResult.object,
            quality_metrics: {
                validation: {
                    passed: validation.passed,
                    issueCount: validation.issues.length,
                    issues: validation.passed ? [] : validation.issues,
                },
                engagement_scores: {
                    same_topic: sameTopicScores,
                    adjacent_topic: adjacentTopicScores,
                },
                generation_attempts: attempt + 1,
            },
        });
    } catch (error) {
        console.error('Optimization error:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate optimizations',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
