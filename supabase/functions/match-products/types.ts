export interface Product {
  id: string;
  product_url: string;
  product_image: string;
  product_title: string;
  product_price: number;
  store_name: string;
  style_embedding: number[];
  style_tags?: string[];
  metadata?: {
    color_palette?: string[];
    occasions?: string[];
    [key: string]: any;
  };
}

export interface UserPreferences {
  priceRange: {
    min: number;
    max: number;
  };
  stylePreferences: string[];
  colorPreferences: string[];
  occasionPreferences: string[];
}

export interface MatchOptions {
  weights?: {
    style: number;
    color: number;
    price: number;
    occasion: number;
  };
  minConfidence?: number;
  includeMetadata?: boolean;
}

export interface MatchScores {
  totalScore: number;
  styleScore: number;
  colorScore: number;
  priceScore: number;
  occasionScore: number;
}

export interface MatchResult extends Product, MatchScores {
  explanation: string;
}