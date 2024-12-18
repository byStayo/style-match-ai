export interface UserData {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  preferences?: {
    style_preferences?: string[];
    color_preferences?: string[];
    price_range?: {
      min: number;
      max: number;
    };
  };
  upload_count?: number;
  subscription_tier?: string;
}

export interface AuthState {
  user: UserData | null;
  loading: boolean;
  error: Error | null;
}