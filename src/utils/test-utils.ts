import { vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

export const mockSupabaseClient = () => {
  const mockClient = {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/test.jpg' } }),
      }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  };

  vi.mock('@/integrations/supabase/client', () => ({
    supabase: mockClient,
  }));

  return mockClient;
};

export const mockFetch = (response: any) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => response,
  });
};