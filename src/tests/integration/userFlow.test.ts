import { describe, it, expect, beforeEach } from 'vitest';
import { mockSupabaseClient, mockFetch } from '@/utils/test-utils';
import { uploadImage } from '@/utils/upload';
import { fetchMatches } from '@/utils/matching';
import { connectSocialAccount } from '@/utils/social';

describe('User Flow Integration', () => {
  beforeEach(() => {
    mockSupabaseClient();
  });

  it('should complete full user flow successfully', async () => {
    // Mock successful image upload
    mockFetch({ 
      url: 'test.jpg',
      embedding: new Array(512).fill(0.1)
    });

    // Upload image
    const uploadResult = await uploadImage('test.jpg');
    expect(uploadResult.url).toBeDefined();

    // Mock matching results
    mockFetch({
      matches: [
        {
          id: '1',
          product_title: 'Test Product',
          similarity: 0.95
        }
      ]
    });

    // Fetch matches
    const matches = await fetchMatches(uploadResult.embedding);
    expect(matches).toHaveLength(1);
    expect(matches[0].similarity).toBeGreaterThan(0.9);

    // Mock social connection
    mockFetch({ 
      success: true,
      profile: { id: 'social123' }
    });

    // Connect social account
    const socialResult = await connectSocialAccount('instagram', 'auth_code');
    expect(socialResult.success).toBe(true);
  });
});