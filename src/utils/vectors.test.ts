import { describe, it, expect } from 'vitest';
import { averageVectors, cosineSimilarity } from './vectors';

describe('Vector Operations', () => {
  describe('averageVectors', () => {
    it('should correctly average vectors', () => {
      const vectors = [
        [1, 2, 3],
        [4, 5, 6],
      ];

      const result = averageVectors(vectors);
      
      expect(result).toEqual([2.5, 3.5, 4.5]);
    });

    it('should handle empty input', () => {
      expect(() => averageVectors([])).toThrow();
    });
  });

  describe('cosineSimilarity', () => {
    it('should calculate similarity between vectors', () => {
      const v1 = [1, 0];
      const v2 = [1, 0];
      
      const similarity = cosineSimilarity(v1, v2);
      
      expect(similarity).toBe(1);
    });

    it('should handle perpendicular vectors', () => {
      const v1 = [1, 0];
      const v2 = [0, 1];
      
      const similarity = cosineSimilarity(v1, v2);
      
      expect(similarity).toBe(0);
    });
  });
});