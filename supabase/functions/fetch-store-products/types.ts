export interface Product {
  url: string;
  image: string;
  title: string;
  price: number;
  description?: string;
}

export interface StoreProduct extends Product {
  store_name: string;
  style_tags?: string[];
  style_embedding?: number[];
}