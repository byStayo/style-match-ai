export const getEmbeddingForImage = async (imageUrl: string): Promise<number[]> => {
  try {
    const response = await fetch('/api/embeddings', {
      method: 'POST',
      body: JSON.stringify({ imageUrl }),
    });

    if (!response.ok) {
      throw new Error('Failed to get embedding');
    }

    const data = await response.json();
    return data.embedding;
  } catch (error) {
    throw new Error(`Failed to get embedding: ${error}`);
  }
};