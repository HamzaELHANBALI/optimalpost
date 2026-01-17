// lib/types.ts

export interface ContentClassification {
    content_type: 'tutorial' | 'story' | 'opinion' | 'general';
    recommended_frameworks: string[];
    classification_reason: string;
}

export interface ContentAnalysis {
    hook: string;
    structure: string;
    retention_mechanics: string;
    niche_and_audience: string;
    topic_angle: string;
    emotional_driver: string;
}

export interface ScriptSegment {
    text: string;
}

export type HookType = 'question' | 'statement' | 'story' | 'statistic';

export interface HookOption {
    hook: string;
    bridge: string;
    hook_type: HookType;
}

export interface SameTopicVariation {
    framework: string;                  // The Viral Framework: "The Myth Buster", "The Negative Case Study", "The X vs Y"
    framework_rationale: string;        // Why this framework works for this topic
    hooks: HookOption[];                // 3 distinct hook options with bridges
    script_content: ScriptSegment[];    // Visual cuts - distinct segments
    retention_tactic: string;           // Strategy explanation
    hashtags: string[];                 // 5 TikTok-relevant hashtags
    video_title: string;                // Short TikTok video title (1-2 lines)
}

export interface AdjacentTopicVariation {
    pivot_type: string;                 // The pivot: Trap, Secret, Next Level, Origin Story, Comparison
    hooks: HookOption[];                // 3 distinct hook options with bridges
    script_content: ScriptSegment[];    // Visual cuts - distinct segments
    pivot_topic: string;
    structure_preserved: string;
    hashtags: string[];                 // 5 TikTok-relevant hashtags
    video_title: string;                // Short TikTok video title (1-2 lines)
}

export interface AnalysisResult {
    classification?: ContentClassification;
    analysis: ContentAnalysis;
    same_topic_variations: SameTopicVariation[];
    adjacent_topic_variations: AdjacentTopicVariation[];
}

export interface Session {
    id: string;
    timestamp: number;
    originalInput: string;
    inputType: 'script' | 'transcribed';
    analysis: ContentAnalysis;
    sameTopicVariations: SameTopicVariation[];
    adjacentTopicVariations: AdjacentTopicVariation[];
}

export interface OptimizeRequest {
    content: string;
    inputType: 'script' | 'transcribed';
}

export interface VideoIdea {
    title: string;
    hook: string;
    rationale: string; // Why this idea fits the niche
}

export interface BrainstormRequest {
    sessionIds: string[];
    ideaCount: number; // 3-20
}

export interface BrainstormSession {
    id: string;
    ideas: VideoIdea[];
    sessionIds: string[];
    ideaCount: number;
    createdAt: string;
}

