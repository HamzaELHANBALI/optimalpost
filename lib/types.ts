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

export interface SameTopicVariation {
    angle_type: string;           // The archetype: Rant, Analyst, Storyteller, Contrarian, Coach
    hooks: string[];              // 3 distinct hook options
    script_content: ScriptSegment[]; // Visual cuts - distinct segments
    retention_tactic: string;     // Strategy explanation
}

export interface AdjacentTopicVariation {
    pivot_type: string;           // The pivot: Trap, Secret, Next Level, Origin Story, Comparison
    hooks: string[];              // 3 distinct hook options
    script_content: ScriptSegment[]; // Visual cuts - distinct segments
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
    inputType: 'voiceover' | 'text-overlay';
    analysis: ContentAnalysis;
    sameTopicVariations: SameTopicVariation[];
    adjacentTopicVariations: AdjacentTopicVariation[];
}

export interface OptimizeRequest {
    content: string;
    inputType: 'voiceover' | 'text-overlay';
}
