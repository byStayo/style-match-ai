export interface ProductMatch {
  id: string;
  product_url: string;
  product_image: string;
  product_title: string;
  product_price: number;
  store_name: string;
  match_score: number;
  match_explanation?: string;
  is_favorite: boolean;
  created_at?: string;
  style_tags?: string[];
}

export interface StyleMatch {
  id: string;
  user_id: string;
  product_id: string;
  match_score: number;
  match_explanation?: string;
  is_favorite: boolean;
  created_at?: string;
}