export interface SupportedStore {
  id: string;
  name: string;
  url: string;
  logo_url?: string;
  integration_type: 'api' | 'scrape';
  is_active: boolean;
  is_official: boolean;
  created_at: string;
}

export interface StoreRequest {
  id: string;
  store_name: string;
  store_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}