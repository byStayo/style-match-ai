import { describe, it, expect, beforeEach } from 'vitest';
import { getEmbeddingForImage } from './embeddings';
import { mockSupabaseClient, mockFetch } from './test-utils';

describe('getEmbeddingForImage', () => {
  beforeEach(() => {
    mockSupabaseClient();
  });

  it('should successfully get embedding for an image', async () => {
    const mockEmbedding = new Array(512).fill(0.1);
    mockFetch({ embedding: mockEmbedding });

    const result = await getEmbeddingForImage('test-image.jpg');
    
    expect(result).toHaveLength(512);
    expect(result).toEqual(mockEmbedding);
  });

  it('should handle errors gracefully', async () => {
    mockFetch({ error: 'Failed to process image' });

    await expect(getEmbeddingForImage('invalid.jpg')).rejects.toThrow();
  });
});