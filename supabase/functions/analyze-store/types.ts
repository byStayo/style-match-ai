export interface OpenAIAnalysis {
  styleTags: string[];
  embedding: number[];
  confidence: number;
  metadata: {
    style_categories: string[];
    key_features: string[];
    color_palette: string[];
    occasions: string[];
    analysis_timestamp: string;
  };
}

export interface StoreStats {
  total_products: number;
  processed: number;
  successful: number;
  failed: number;
  start_time: string;
  end_time?: string;
}

export interface ProcessingResult {
  success: boolean;
  productId: string;
  error?: string;
}