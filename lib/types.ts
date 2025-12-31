// lib/types.ts

export interface ContentAnalysis {
    hook: string;
    structure: string;
    retention_mechanics: string;
    niche_and_audience: string;
    topic_angle: string;
    emotional_driver: string;
}

export interface SameTopicVariation {
    hooks: string[]; // Array of 3 options
    script_body: string; // The main content (teleprompter format)
    retention_tactic: string; // Explanation of the strategy
}

export interface AdjacentTopicVariation {
    hooks: string[]; // Array of 3 options
    script_body: string;
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
