import { Product } from '../types';

export async function scrapeNordstrom(): Promise<Product[]> {
  try {
    const response = await fetch('https://api.nordstrom.com/products', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Nordstrom API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.products.map((product: any) => ({
      url: `https://www.nordstrom.com/s/${product.id}`,
      image: product.defaultImage,
      title: product.name,
      price: product.price.regular,
      description: product.description || ''
    }));
  } catch (error) {
    console.error('Error scraping Nordstrom:', error);
    return [];
  }
}