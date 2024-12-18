import { Product } from '../types';

export async function scrapeMango(): Promise<Product[]> {
  try {
    const response = await fetch('https://shop.mango.com/services/productlist/products/US/she', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Mango API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.products.map((product: any) => ({
      url: `https://shop.mango.com${product.url}`,
      image: product.images[0].src,
      title: product.name,
      price: product.price.value,
      description: product.description || ''
    }));
  } catch (error) {
    console.error('Error scraping Mango:', error);
    return [];
  }
}