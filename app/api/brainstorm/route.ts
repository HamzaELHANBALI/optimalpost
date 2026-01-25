import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { BrainstormRequest } from '@/lib/types';

// ============================================================================
// SCHEMAS
// ============================================================================

const patternAnalysisSchema = z.object({
    niche_identification: z.object({
        primary_niche: z.string().describe('The main content niche (e.g., "tech productivity", "fitness for beginners")'),
        confidence_score: z.number().min(0).max(100).describe('Confidence in niche identification (0-100)'),
        supporting_evidence: z.array(z.string()).describe('Specific examples from sessions supporting this niche'),
        outlier_sessions: z.array(z.number()).describe('Session indices that deviate from the main niche (0-indexed)'),
        sub_niches: z.array(z.string()).describe('Secondary topics within the main niche'),
    }),
    successful_patterns: z.object({
        top_hook_types: z.array(z.object({
            type: z.enum(['question', 'statement', 'story', 'statistic']),
            frequency: z.number().describe('How many times this type appears'),
            examples: z.array(z.string()).min(1).max(3).describe('1-3 example hooks'),
            effectiveness_note: z.string().describe('Why this type works for this niche'),
        })).describe('Hook types ranked by frequency'),
        common_frameworks: z.array(z.object({
            framework: z.string().describe('Framework name'),
            frequency: z.number(),
            use_cases: z.string().describe('What topics this framework is used for'),
        })),
        emotional_drivers: z.array(z.object({
            emotion: z.string().describe('Core emotion (e.g., "fear of missing out", "inspiration")'),
            frequency: z.number(),
            trigger_phrases: z.array(z.string()).describe('Phrases that trigger this emotion'),
        })),
        recurring_topics: z.array(z.object({
            topic: z.string().describe('Topic theme'),
            frequency: z.number(),
            related_keywords: z.array(z.string()).describe('Keywords associated with this topic'),
        })),
        pacing_style: z.object({
            avg_segments: z.number().describe('Average number of segments/beats'),
            preferred_length: z.enum(['short', 'medium', 'long']).describe('Typical content length'),
            rhythm: z.string().describe('Pacing description (e.g., "fast-paced with quick cuts")'),
        }),
    }),
    audience_insights: z.object({
        pain_points: z.array(z.string()).describe('Problems the audience faces'),
        aspirations: z.array(z.string()).describe('What the audience wants to achieve'),
        knowledge_level: z.enum(['beginner', 'intermediate', 'advanced', 'mixed']).describe('Audience expertise level'),
        demographics: z.string().describe('Inferred audience demographics and characteristics'),
    }),
    content_gaps: z.array(z.string()).describe('Potential topics not yet covered that fit the niche'),
});

const enhancedVideoIdeaSchema = z.object({
    ideas: z.array(z.object({
        title: z.string().describe('Compelling, specific video title'),
        hook: z.string().describe('Scroll-stopping opening hook (first line of the video)'),
        rationale: z.string().describe('Why this idea fits the niche and patterns (2-3 sentences)'),
        framework: z.enum([
            'The Direct Breakdown',
            'The Myth Buster',
            'The Negative Case Study',
            'The X vs Y'
        ]).describe('Recommended framework for this idea'),
        angle: z.enum([
            'beginner-friendly',
            'contrarian',
            'advanced-tip',
            'common-mistake',
            'how-to',
            'case-study',
            'comparison'
        ]).describe('Content angle'),
        hook_type: z.enum(['question', 'statement', 'story', 'statistic']).describe('Hook type used'),
        estimated_difficulty: z.enum(['easy', 'medium', 'hard']).describe('Production difficulty'),
        topic_category: z.string().describe('Which recurring topic category this falls under'),
        emotional_driver: z.string().describe('Primary emotion this content targets'),
        target_audience_segment: z.string().describe('Specific audience segment this appeals to'),
    })).min(3).max(20),
    diversity_check: z.object({
        framework_distribution: z.record(z.string(), z.number()).describe('Count of each framework used'),
        angle_distribution: z.record(z.string(), z.number()).describe('Count of each angle used'),
        hook_type_distribution: z.record(z.string(), z.number()).describe('Count of each hook type'),
        passes_diversity: z.boolean().describe('Whether ideas have sufficient variety'),
    }),
});

// ============================================================================
// OUTLIER DETECTION
// ============================================================================

interface OutlierAnalysis {
    mainCluster: any[];
    outliers: any[];
    clusteringReason: string;
    dominantThemes: string[];
    outlierReasons: Array<{ sessionIndex: number; reason: string }>;
}

function detectOutliers(sessions: any[]): OutlierAnalysis {
    if (sessions.length < 3) {
        return {
            mainCluster: sessions,
            outliers: [],
            clusteringReason: 'Too few sessions to detect outliers',
            dominantThemes: [],
            outlierReasons: [],
        };
    }

    // Extract topics and niches from all sessions
    const topicData = sessions.map(s => ({
        topic: (s.analysis?.topic_angle || '').toLowerCase(),
        niche: (s.analysis?.niche_and_audience || '').toLowerCase(),
        emotionalDriver: (s.analysis?.emotional_driver || '').toLowerCase(),
    }));

    // Build word frequency map
    const wordFrequency: Record<string, number> = {};
    topicData.forEach(({ topic, niche }) => {
        const allText = `${topic} ${niche}`;
        const words = allText
            .split(/\s+/)
            .map(w => w.replace(/[^\w]/g, ''))
            .filter(w => w.length > 4); // Only meaningful words

        words.forEach(word => {
            wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        });
    });

    // Find dominant themes (words appearing in 30%+ of sessions)
    const threshold = Math.max(2, Math.floor(sessions.length * 0.3));
    const dominantWords = Object.entries(wordFrequency)
        .filter(([_, count]) => count >= threshold)
        .sort(([_, a], [__, b]) => b - a)
        .slice(0, 10)
        .map(([word]) => word);

    if (dominantWords.length === 0) {
        return {
            mainCluster: sessions,
            outliers: [],
            clusteringReason: 'No clear dominant themes found - content is highly diverse',
            dominantThemes: [],
            outlierReasons: [],
        };
    }

    // Calculate relevance score for each session
    const sessionScores = sessions.map((session, idx) => {
        const { topic, niche } = topicData[idx];
        const allText = `${topic} ${niche}`;

        const matchCount = dominantWords.filter(word =>
            allText.includes(word)
        ).length;

        return {
            session,
            sessionIndex: idx,
            score: matchCount,
            matchedWords: dominantWords.filter(word => allText.includes(word)),
        };
    });

    // Determine outlier threshold (sessions with very low relevance scores)
    const scores = sessionScores.map(s => s.score);
    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const outlierThreshold = Math.max(1, avgScore * 0.4); // 40% of average

    const mainCluster: any[] = [];
    const outliers: any[] = [];
    const outlierReasons: Array<{ sessionIndex: number; reason: string }> = [];

    sessionScores.forEach(({ session, sessionIndex, score, matchedWords }) => {
        if (score < outlierThreshold) {
            outliers.push(session);
            outlierReasons.push({
                sessionIndex,
                reason: `Low relevance score (${score}/${dominantWords.length} themes matched). Matched: ${matchedWords.join(', ') || 'none'}`,
            });
        } else {
            mainCluster.push(session);
        }
    });

    return {
        mainCluster,
        outliers,
        clusteringReason: `Identified ${dominantWords.length} dominant themes appearing in ${threshold}+ sessions`,
        dominantThemes: dominantWords,
        outlierReasons,
    };
}

// ============================================================================
// IDEA ALIGNMENT SCORING
// ============================================================================

interface AlignmentScore {
    totalScore: number;
    breakdown: {
        hookTypeMatch: number;
        topicRelevance: number;
        frameworkFit: number;
        emotionalAlignment: number;
        diversityBonus: number;
    };
    issues: string[];
    strengths: string[];
}

function scoreIdeaAlignment(
    idea: any,
    patterns: any,
    allIdeas: any[]
): AlignmentScore {
    const breakdown = {
        hookTypeMatch: 0,
        topicRelevance: 0,
        frameworkFit: 0,
        emotionalAlignment: 0,
        diversityBonus: 0,
    };
    const issues: string[] = [];
    const strengths: string[] = [];

    // 1. Hook type alignment (0-3 points)
    const topHookTypes = patterns.successful_patterns.top_hook_types
        .slice(0, 2)
        .map((h: any) => h.type);

    if (topHookTypes.includes(idea.hook_type)) {
        breakdown.hookTypeMatch = 3;
        strengths.push(`Uses proven hook type: ${idea.hook_type}`);
    } else {
        breakdown.hookTypeMatch = 1;
        issues.push(`Hook type '${idea.hook_type}' doesn't match top patterns: ${topHookTypes.join(', ')}`);
    }

    // 2. Topic relevance (0-4 points)
    const ideaTitleLower = idea.title.toLowerCase();
    const recurringTopics = patterns.successful_patterns.recurring_topics || [];

    const matchedTopic = recurringTopics.find((t: any) =>
        ideaTitleLower.includes(t.topic.toLowerCase()) ||
        t.related_keywords.some((kw: string) => ideaTitleLower.includes(kw.toLowerCase()))
    );

    if (matchedTopic) {
        breakdown.topicRelevance = 4;
        strengths.push(`Aligns with recurring topic: ${matchedTopic.topic}`);
    } else {
        breakdown.topicRelevance = 1;
        issues.push('Topic doesn\'t match any recurring themes');
    }

    // 3. Framework fit (0-3 points)
    const commonFrameworks = patterns.successful_patterns.common_frameworks || [];
    const matchedFramework = commonFrameworks.find((f: any) =>
        f.framework === idea.framework
    );

    if (matchedFramework) {
        breakdown.frameworkFit = 3;
        strengths.push(`Uses proven framework: ${idea.framework}`);
    } else {
        breakdown.frameworkFit = 1;
    }

    // 4. Emotional alignment (0-3 points)
    const emotionalDrivers = patterns.successful_patterns.emotional_drivers || [];
    const matchedEmotion = emotionalDrivers.find((e: any) =>
        idea.emotional_driver.toLowerCase().includes(e.emotion.toLowerCase()) ||
        e.emotion.toLowerCase().includes(idea.emotional_driver.toLowerCase())
    );

    if (matchedEmotion) {
        breakdown.emotionalAlignment = 3;
        strengths.push(`Matches emotional driver: ${matchedEmotion.emotion}`);
    } else {
        breakdown.emotionalAlignment = 1;
        issues.push('Emotional driver doesn\'t match patterns');
    }

    // 5. Diversity bonus (0-2 points)
    // Check if this idea adds variety to the set
    const sameFrameworkCount = allIdeas.filter(i => i.framework === idea.framework).length;
    const sameAngleCount = allIdeas.filter(i => i.angle === idea.angle).length;

    if (sameFrameworkCount <= 2 && sameAngleCount <= 2) {
        breakdown.diversityBonus = 2;
        strengths.push('Adds healthy variety to idea set');
    } else if (sameFrameworkCount > 3 || sameAngleCount > 3) {
        breakdown.diversityBonus = 0;
        issues.push('Too similar to other ideas in the set');
    } else {
        breakdown.diversityBonus = 1;
    }

    const totalScore = Object.values(breakdown).reduce((sum, score) => sum + score, 0);

    return {
        totalScore,
        breakdown,
        issues,
        strengths,
    };
}

// ============================================================================
// PROMPT BUILDERS
// ============================================================================

function buildPatternExtractionPrompt(sessions: any[]): string {
    const sessionSummaries = sessions.map((s, idx) => {
        // Extract hooks from variations
        const sampleHooks = [
            ...(s.sameTopicVariations as any[] || []).slice(0, 2).flatMap((v: any) =>
                v.hooks?.slice(0, 1).map((h: any) => h.hook) || []
            ),
        ].slice(0, 3);

        // Extract frameworks
        const frameworks = (s.sameTopicVariations as any[] || [])
            .map((v: any) => v.framework)
            .filter(Boolean);

        return `
--- Session ${idx + 1} ---
Original Content: ${s.originalInput.slice(0, 400)}${s.originalInput.length > 400 ? '...' : ''}
Analysis:
  - Niche & Audience: ${s.analysis?.niche_and_audience || 'N/A'}
  - Topic Angle: ${s.analysis?.topic_angle || 'N/A'}
  - Hook: ${s.analysis?.hook || 'N/A'}
  - Emotional Driver: ${s.analysis?.emotional_driver || 'N/A'}
  - Structure: ${s.analysis?.structure || 'N/A'}
  - Retention Mechanics: ${s.analysis?.retention_mechanics || 'N/A'}
Generated Hooks: ${sampleHooks.join(' | ') || 'None'}
Frameworks Used: ${frameworks.join(', ') || 'None'}
`;
    }).join('\n');

    return `Analyze these ${sessions.length} content sessions and extract patterns.

${sessionSummaries}

### YOUR TASK:
1. **Identify the Primary Niche**: What is the creator's main content focus? Be specific.
2. **Detect Outliers**: Which sessions (by index 0-${sessions.length - 1}) don't fit the main niche?
3. **Extract Successful Patterns**:
   - What hook types appear most? (question, statement, story, statistic)
   - What frameworks are used? (Myth Buster, Direct Breakdown, etc.)
   - What emotions drive the content? (FOMO, inspiration, fear, curiosity)
   - What topics recur? (List distinct topics with their frequency)
   - What's the typical pacing/structure?
4. **Understand the Audience**:
   - What pain points are addressed?
   - What are their goals/aspirations?
   - What's their knowledge level?
5. **Identify Content Gaps**: What related topics haven't been covered yet?

Be thorough and specific. Use actual examples from the sessions.`;
}

function buildIdeaGenerationPrompt(
    patternAnalysis: any,
    ideaCount: number
): string {
    const patterns = patternAnalysis.object;
    const niche = patterns.niche_identification;
    const successful = patterns.successful_patterns;
    const audience = patterns.audience_insights;

    return `Generate ${ideaCount} video ideas that perfectly align with this creator's niche and proven patterns.

### NICHE IDENTIFICATION:
Primary Niche: ${niche.primary_niche}
Confidence: ${niche.confidence_score}%
Sub-Niches: ${niche.sub_niches.join(', ')}
Evidence: ${niche.supporting_evidence.slice(0, 2).join('; ')}

### PROVEN PATTERNS TO FOLLOW:
**Hook Types** (use these):
${successful.top_hook_types.map((h: any) =>
        `- ${h.type} (used ${h.frequency}x): ${h.examples[0]}`
    ).join('\n')}

**Successful Frameworks**:
${successful.common_frameworks.map((f: any) =>
        `- ${f.framework} (${f.frequency}x) - ${f.use_cases}`
    ).join('\n')}

**Emotional Drivers**:
${successful.emotional_drivers.map((e: any) =>
        `- ${e.emotion} (${e.frequency}x)`
    ).join('\n')}

**Recurring Topics**:
${successful.recurring_topics.map((t: any) =>
        `- ${t.topic} (${t.frequency}x) - Keywords: ${t.related_keywords.join(', ')}`
    ).join('\n')}

**Pacing Style**: ${successful.pacing_style.rhythm}

### AUDIENCE INSIGHTS:
Knowledge Level: ${audience.knowledge_level}
Pain Points: ${audience.pain_points.join('; ')}
Aspirations: ${audience.aspirations.join('; ')}
Demographics: ${audience.demographics}

### CONTENT GAPS TO EXPLORE:
${patterns.content_gaps.join('\n')}

### REQUIREMENTS:
1. Generate EXACTLY ${ideaCount} ideas
2. Each idea must:
   - Align with the primary niche: "${niche.primary_niche}"
   - Use hook types that have proven successful
   - Match the established frameworks and emotional drivers
   - Address audience pain points or aspirations
   - Feel cohesive with existing content
   - Offer a fresh angle or explore a content gap

3. ENSURE DIVERSITY:
   - Use at least 2 different frameworks across all ideas
   - Mix angles: beginner-friendly, contrarian, advanced-tip, common-mistake, how-to
   - Vary hook types (don't use all questions or all statements)
   - Spread across different recurring topics
   - Include various difficulty levels

4. QUALITY STANDARDS:
   - Titles must be specific and compelling
   - Hooks must be scroll-stopping (not generic)
   - Rationale must clearly explain the alignment with patterns
   - Each idea should be immediately actionable

Generate ideas that feel like natural extensions of this creator's content strategy.`;
}

// ============================================================================
// SYSTEM PROMPTS
// ============================================================================

const patternExtractionSystemPrompt = `You are a Content Pattern Recognition AI. Your job is to analyze a creator's content history and extract deep insights about their niche, audience, and what works.

### YOUR EXPERTISE:
- Identifying content niches with precision
- Detecting outliers and inconsistencies
- Extracting successful patterns from examples
- Understanding audience psychology
- Recognizing content gaps and opportunities

### YOUR APPROACH:
- Be specific, not generic (avoid "social media tips" → prefer "Instagram Reels growth for service businesses")
- Use actual data from sessions (cite specific examples)
- Quantify patterns (frequencies, percentages)
- Think like a strategist: why do these patterns work?
- Identify what's missing that could work

Be thorough, analytical, and strategic in your analysis.`;

const ideaGenerationSystemPrompt = `You are a Content Strategy AI specialized in generating video ideas that perfectly match a creator's established niche and patterns.

### YOUR MISSION:
Generate ideas that feel like they were created by the same creator - matching their style, audience, and proven patterns while introducing fresh angles.

### YOUR PRINCIPLES:
1. **Niche Coherence**: Every idea must fit the identified niche
2. **Pattern Matching**: Use proven hook types, frameworks, and emotional drivers
3. **Fresh Angles**: Don't rehash - find new perspectives within the niche
4. **Audience-Centric**: Address real pain points and aspirations
5. **Diversity**: Vary frameworks, angles, and topics while staying on-brand
6. **Actionability**: Ideas should be ready to execute

### QUALITY CHECKS:
- Would this idea feel natural on this creator's channel?
- Does it match the successful patterns identified?
- Is it specific enough to be useful?
- Does it add value to the content library?
- Is there healthy variety across all ideas?

Generate ideas that excite the creator and resonate with their audience.`;

// ============================================================================
// MAIN ROUTE
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: BrainstormRequest = await request.json();
        const { sessionIds, ideaCount } = body;

        // Validation
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
                userId: session.user.id,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (sessions.length === 0) {
            return NextResponse.json({ error: 'No valid sessions found' }, { status: 404 });
        }

        console.log(`🎯 Brainstorming from ${sessions.length} sessions for ${ideaCount} ideas`);

        // STEP 1: Detect outliers
        const outlierAnalysis = detectOutliers(sessions);
        console.log(`📊 Outlier detection:`, {
            mainCluster: outlierAnalysis.mainCluster.length,
            outliers: outlierAnalysis.outliers.length,
            dominantThemes: outlierAnalysis.dominantThemes.slice(0, 5),
        });

        if (outlierAnalysis.outliers.length > 0) {
            console.log(`⚠️  Ignoring ${outlierAnalysis.outliers.length} outlier sessions:`,
                outlierAnalysis.outlierReasons.map(r => `Session ${r.sessionIndex}: ${r.reason}`)
            );
        }

        // Use main cluster for analysis
        const sessionsToAnalyze = outlierAnalysis.mainCluster.length > 0
            ? outlierAnalysis.mainCluster
            : sessions; // Fallback if all are outliers

        // STEP 2: Extract patterns
        console.log('🔍 Extracting patterns...');
        const patternAnalysis = await generateObject({
            model: openai('gpt-4o-mini'),
            schema: patternAnalysisSchema,
            system: patternExtractionSystemPrompt,
            prompt: buildPatternExtractionPrompt(sessionsToAnalyze),
        });

        const patterns = patternAnalysis.object;
        console.log('✅ Pattern extraction complete:', {
            niche: patterns.niche_identification.primary_niche,
            confidence: patterns.niche_identification.confidence_score,
            topHooks: patterns.successful_patterns.top_hook_types.map(h => h.type),
            topTopics: patterns.successful_patterns.recurring_topics.slice(0, 3).map(t => t.topic),
        });

        // STEP 3: Generate ideas
        console.log(`💡 Generating ${ideaCount} ideas...`);
        const ideaGeneration = await generateObject({
            model: openai('gpt-4o'),
            schema: enhancedVideoIdeaSchema,
            system: ideaGenerationSystemPrompt,
            prompt: buildIdeaGenerationPrompt(patternAnalysis, ideaCount),
        });

        const generatedIdeas = ideaGeneration.object.ideas.slice(0, ideaCount);
        console.log(`✅ Generated ${generatedIdeas.length} ideas`);

        // STEP 4: Score idea alignment
        const scoredIdeas = generatedIdeas.map(idea => {
            const alignment = scoreIdeaAlignment(idea, patterns, generatedIdeas);
            return {
                ...idea,
                alignment_score: alignment.totalScore,
                alignment_breakdown: alignment.breakdown,
                alignment_issues: alignment.issues,
                alignment_strengths: alignment.strengths,
            };
        });

        // Sort by alignment score (best first)
        scoredIdeas.sort((a, b) => b.alignment_score - a.alignment_score);

        const avgScore = scoredIdeas.reduce((sum, idea) => sum + idea.alignment_score, 0) / scoredIdeas.length;
        console.log('📊 Alignment scores:', {
            average: avgScore.toFixed(1),
            best: scoredIdeas[0].alignment_score,
            worst: scoredIdeas[scoredIdeas.length - 1].alignment_score,
        });

        // STEP 5: Save brainstorm session
        const brainstormSession = await prisma.brainstormSession.create({
            data: {
                userId: session.user.id,
                ideas: scoredIdeas,
                sessionIds: sessionIds,
                ideaCount: scoredIdeas.length,
                // Store analysis metadata
                metadata: {
                    patternAnalysis: patterns,
                    outlierAnalysis: {
                        outlierCount: outlierAnalysis.outliers.length,
                        outlierReasons: outlierAnalysis.outlierReasons,
                        dominantThemes: outlierAnalysis.dominantThemes,
                    },
                    diversityCheck: ideaGeneration.object.diversity_check,
                    avgAlignmentScore: avgScore,
                },
            },
        });

        console.log(`✅ Brainstorm session saved: ${brainstormSession.id}`);

        // Return comprehensive response
        return NextResponse.json({
            ideas: scoredIdeas,
            sessionId: brainstormSession.id,
            analysis: {
                niche: patterns.niche_identification,
                patterns: {
                    topHookTypes: patterns.successful_patterns.top_hook_types.slice(0, 3),
                    commonFrameworks: patterns.successful_patterns.common_frameworks.slice(0, 3),
                    recurringTopics: patterns.successful_patterns.recurring_topics.slice(0, 5),
                    emotionalDrivers: patterns.successful_patterns.emotional_drivers.slice(0, 3),
                },
                audience: patterns.audience_insights,
                contentGaps: patterns.content_gaps,
            },
            outliers: {
                count: outlierAnalysis.outliers.length,
                reasons: outlierAnalysis.outlierReasons,
            },
            quality: {
                avgAlignmentScore: avgScore,
                diversityCheck: ideaGeneration.object.diversity_check,
            },
        });
    } catch (error) {
        console.error('Brainstorm error:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate ideas',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
