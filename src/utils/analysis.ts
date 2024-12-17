export const analyzeImage = async (imageUrl: string) => {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ imageUrl }),
    });
    
    if (!response.ok) {
      throw new Error('Analysis failed');
    }
    
    const data = await response.json();
    return {
      style_tags: data.tags,
      embedding: data.embedding,
    };
  } catch (error) {
    throw new Error(`Failed to analyze image: ${error}`);
  }
};