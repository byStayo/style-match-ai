import { describe, it, expect, beforeEach } from 'vitest';
import { fetchStoreProducts } from './store';
import { mockSupabaseClient, mockFetch } from './test-utils';

describe('fetchStoreProducts', () => {
  beforeEach(() => {
    mockSupabaseClient();
  });

  it('should fetch products from a store successfully', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'Test Product',
        price: 99.99,
        image: 'test.jpg',
      },
    ];

    mockFetch({ products: mockProducts });

    const result = await fetchStoreProducts('test-store');
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Test Product');
  });

  it('should handle store API errors', async () => {
    mockFetch({ error: 'Store API error' });

    await expect(fetchStoreProducts('invalid-store')).rejects.toThrow();
  });
});