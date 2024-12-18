export interface UserData {
  id: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  provider?: string;
  isAnonymous?: boolean;
  preferences: {
    colors?: string[];
    styles?: string[];
    sizes?: string[];
    [key: string]: any;
  };
  uploads: string[];
  favorites: string[];
  subscription_status?: string;
  subscription_tier?: string;
  openai_api_key?: string;
  connectedAccounts?: {
    instagram?: {
      connected: boolean;
      lastSync: string;
    };
    facebook?: {
      connected: boolean;
      lastSync: string;
    };
    tiktok?: {
      connected: boolean;
      lastSync: string;
    };
  };
}