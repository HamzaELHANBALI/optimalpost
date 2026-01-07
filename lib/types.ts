// lib/types.ts

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
}

export interface AdjacentTopicVariation {
    pivot_type: string;                 // The pivot: Trap, Secret, Next Level, Origin Story, Comparison
    hooks: HookOption[];                // 3 distinct hook options with bridges
    script_content: ScriptSegment[];    // Visual cuts - distinct segments
    pivot_topic: string;
    structure_preserved: string;
}

export interface AnalysisResult {
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
