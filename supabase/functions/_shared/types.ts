export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export interface StyleAnalysis {
  style_tags: string[];
  embedding: number[];
  confidence_scores: number[] | null;
  metadata: {
    provider: string;
    model: string;
    description?: string;
    style_categories?: string[];
    key_features?: string[];
    color_palette?: string[];
    occasions?: string[];
    style_attributes?: string[];
    [key: string]: any;
  };
}

export const STYLE_CATEGORIES = [
  'casual',
  'formal',
  'business',
  'streetwear',
  'athletic',
  'bohemian',
  'vintage',
  'minimalist',
  'preppy',
  'punk',
  'grunge',
  'luxury',
  'athleisure',
  'classic',
  'trendy',
  'romantic',
  'edgy',
  'retro',
  'avant-garde',
  'sustainable'
];