export const fetchStoreProducts = async (storeId: string) => {
  try {
    const response = await fetch(`/api/stores/${storeId}/products`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch store products');
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch store products: ${error}`);
  }
};