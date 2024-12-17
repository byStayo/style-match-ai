export const averageVectors = (vectors: number[][]): number[] => {
  if (vectors.length === 0) {
    throw new Error('Cannot average empty vector array');
  }

  const dimension = vectors[0].length;
  const result = new Array(dimension).fill(0);

  for (const vector of vectors) {
    if (vector.length !== dimension) {
      throw new Error('All vectors must have the same dimension');
    }
    for (let i = 0; i < dimension; i++) {
      result[i] += vector[i];
    }
  }

  return result.map(sum => sum / vectors.length);
};

export const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};