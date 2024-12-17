export interface StyleAnalysis {
  style_tags: string[];
  embedding: number[] | null;
  confidence_scores: number[] | null;
  metadata: {
    provider: 'huggingface' | 'openai';
    model: string;
    description?: string;
    classification_model?: string;
  };
}

export const STYLE_CATEGORIES = [
  "casual wear", "formal wear", "streetwear", "bohemian", 
  "minimalist", "vintage", "athletic wear", "business casual",
  "evening wear", "summer style", "winter fashion"
];

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};