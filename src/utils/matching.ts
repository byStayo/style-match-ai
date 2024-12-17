export const fetchMatches = async (embedding: number[], products?: any[]) => {
  try {
    if (products) {
      // For testing with mock products
      return products
        .map(product => ({
          ...product,
          similarity: calculateSimilarity(embedding, product.embedding)
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10);
    }

    const response = await fetch('/api/match', {
      method: 'POST',
      body: JSON.stringify({ embedding }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch matches');
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch matches: ${error}`);
  }
};

const calculateSimilarity = (vec1: number[], vec2: number[]): number => {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
};