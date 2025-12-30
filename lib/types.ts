// Types for OptimalPost

export interface ContentAnalysis {
    hook: string;
    structure: string;
    retention_mechanics: string;
    topic_angle: string;
    emotional_driver: string;
}

export interface SameTopicVariation {
    content: string;
    hook_used: string;
}

export interface NewTopicVariation {
    content: string;
    new_topic: string;
    structure_preserved: string;
}

export interface AnalysisResult {
    analysis: ContentAnalysis;
    same_topic_variations: SameTopicVariation[];
    new_topic_variations: NewTopicVariation[];
}

export interface Session {
    id: string;
    timestamp: number;
    originalInput: string;
    inputType: 'voiceover' | 'text-overlay';
    analysis: ContentAnalysis;
    sameTopicVariations: SameTopicVariation[];
    newTopicVariations: NewTopicVariation[];
}

export interface OptimizeRequest {
    content: string;
    inputType: 'voiceover' | 'text-overlay';
}
