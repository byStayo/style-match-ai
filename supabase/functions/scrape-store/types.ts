export interface Product {
  url: string;
  image: string;
  title: string;
  price: number;
  description?: string;
}

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

export interface ProcessingStats {
  start_time: string;
  end_time?: string;
  total_products?: number;
  processed_products?: number;
  success_count?: number;
  failed_count?: number;
  error?: string;
  store?: string;
  user_id?: string;
}