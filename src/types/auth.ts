export interface UserData {
  id: string;
  email?: string;
  preferences?: Record<string, any>;
  subscription_tier?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  userData: UserData | null;
  isLoading: boolean;
  error: Error | null;
}