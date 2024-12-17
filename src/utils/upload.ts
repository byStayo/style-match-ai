export const uploadImage = async (imageFile: string) => {
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ imageUrl: imageFile }),
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    const data = await response.json();
    return {
      url: data.url,
      embedding: data.embedding,
    };
  } catch (error) {
    throw new Error(`Failed to upload image: ${error}`);
  }
};