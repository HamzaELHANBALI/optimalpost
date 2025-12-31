// Types for OptimalPost - Updated for Teleprompter + Hook A/B Testing
// Includes legacy fields for backwards compatibility with old sessions

export interface ContentAnalysis {
    // New schema fields
    hook_mechanic?: string;
    pacing_score?: string;
    emotional_payoff?: string;
    // Legacy fields (for old sessions)
    hook?: string;
    structure?: string;
    retention_mechanics?: string;
    niche_and_audience?: string;
    topic_angle?: string;
    emotional_driver?: string;
}

export interface SameTopicVariation {
    // New schema
    hooks?: string[];          // 3 distinct hook options for A/B testing
    script_body?: string;      // Teleprompter-formatted body (no hook)
    why_it_works?: string;
    // Legacy fields
    content?: string;
    hook_used?: string;
}

export interface AdjacentTopicVariation {
    // New schema
    target_audience?: string;
    hooks?: string[];          // 3 distinct hook options
    script_body?: string;      // Teleprompter-formatted body
    // Legacy fields
    content?: string;
    pivot_topic?: string;
    structure_preserved?: string;
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
