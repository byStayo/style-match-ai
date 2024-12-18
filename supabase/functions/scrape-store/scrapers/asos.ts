import { Product } from '../types';

export async function scrapeAsos(): Promise<Product[]> {
  try {
    const response = await fetch('https://api.asos.com/product/search/v2/categories/4209', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`ASOS API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.products.map((product: any) => ({
      url: `https://www.asos.com/product/${product.id}`,
      image: product.imageUrl,
      title: product.name,
      price: product.price.current.value,
      description: product.description || ''
    }));
  } catch (error) {
    console.error('Error scraping ASOS:', error);
    return [];
  }
}