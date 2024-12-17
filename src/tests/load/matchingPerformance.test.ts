import { describe, it, expect, beforeEach } from 'vitest';
import { mockSupabaseClient } from '@/utils/test-utils';
import { fetchMatches } from '@/utils/matching';

describe('Matching Performance', () => {
  beforeEach(() => {
    mockSupabaseClient();
  });

  it('should handle large product sets efficiently', async () => {
    // Generate 10k mock products
    const mockProducts = Array.from({ length: 10000 }, (_, i) => ({
      id: `prod${i}`,
      embedding: new Array(512).fill(Math.random()),
      title: `Product ${i}`
    }));

    const testEmbedding = new Array(512).fill(0.1);
    
    const startTime = performance.now();
    
    const matches = await fetchMatches(testEmbedding, mockProducts);
    
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Ensure response time is under 1 second
    expect(duration).toBeLessThan(1000);
    expect(matches).toBeDefined();
    expect(matches.length).toBeGreaterThan(0);
  });
});