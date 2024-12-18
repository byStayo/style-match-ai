import { Product } from '../types';

export async function scrapeAsos(): Promise<Product[]> {
  try {
    const response = await fetch('https://api.asos.com/product/search/v2/categories/4209');
    const data = await response.json();
    
    return data.products.map((product: any) => ({
      url: `https://www.asos.com/product/${product.id}`,
      image: product.imageUrl,
      title: product.name,
      price: product.price.current.value,
      description: product.description
    }));
  } catch (error) {
    console.error('Error scraping ASOS:', error);
    return [];
  }
}