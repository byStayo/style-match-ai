export interface UploadProgress {
  stage: 'upload' | 'analysis' | 'matching';
  percent: number;
  message: string;
}

export interface StyleAnalysis {
  embedding: number[];
  style_tags: string[];
  confidence_scores: {
    style: number;
    color: number;
    occasion: number;
  };
  metadata: {
    style_attributes: string[];
    color_analysis: {
      dominant: string[];
      accent: string[];
      palette: string[];
    };
    occasion_matches: string[];
    analysis_timestamp: string;
    vision_model: string;
    analysis_provider: string;
  };
}

export interface MatchingOptions {
  weightedScoring: boolean;
  styleTagMatching: boolean;
  confidenceThreshold: number;
  priceRangeMatching: boolean;
  colorMatching: boolean;
  occasionMatching: boolean;
  weights: {
    style: number;
    color: number;
    occasion: number;
    price: number;
  };
}