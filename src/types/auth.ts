export interface UserData {
  id: string;
  email?: string;
  preferences?: {
    style_preferences?: string[];
    color_preferences?: string[];
    price_range?: {
      min: number;
      max: number;
    };
    occasion_preferences?: string[];
    size_preferences?: Record<string, string>;
    brand_preferences?: string[];
  };
  subscription_tier?: string;
  created_at?: string;
  updated_at?: string;
  upload_count?: number;
  last_analysis?: {
    timestamp: string;
    style_vector?: number[];
    confidence_score?: number;
  };
}

export interface AuthState {
  userData: UserData | null;
  isLoading: boolean;
  error: Error | null;
}