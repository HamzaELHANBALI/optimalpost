// Types for OptimalPost

export interface ContentAnalysis {
    hook: string;
    structure: string;
    retention_mechanics: string;
    niche_and_audience: string;
    topic_angle: string;
    emotional_driver: string;
}

export interface SameTopicVariation {
    content: string;
    hook_used: string;
}

export interface AdjacentTopicVariation {
    content: string;
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
