import { Product } from '../types';

export async function scrapeNike(): Promise<Product[]> {
  try {
    const response = await fetch('https://api.nike.com/cic/browse/v2');
    const data = await response.json();
    
    return data.products.map((product: any) => ({
      url: `https://www.nike.com/${product.url}`,
      image: product.images.squarishURL,
      title: product.title,
      price: product.price.currentPrice,
      description: product.description
    }));
  } catch (error) {
    console.error('Error scraping Nike:', error);
    return [];
  }
}