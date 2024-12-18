export interface Product {
  url: string;
  image: string;
  title: string;
  price: number;
  description?: string;
}

export interface Store {
  id: string;
  name: string;
  url: string;
  integration_type: 'api' | 'scrape';
}

export interface ScrapingStats {
  total_products: number;
  processed: number;
  successful: number;
  failed: number;
  start_time?: string;
  end_time?: string;
}

export interface ScrapingLog {
  id: string;
  store_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  processing_stats: ScrapingStats;
  batch_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OpenAIAnalysis {
  styleTags: string[];
  embedding: number[];
  confidence: number;
  metadata?: {
    style_categories?: string[];
    key_features?: string[];
    color_palette?: string[];
    occasions?: string[];
  };
}