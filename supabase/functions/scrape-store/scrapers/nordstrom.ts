import { Product } from '../types';

export async function scrapeNordstrom(): Promise<Product[]> {
  try {
    const response = await fetch('https://api.nordstrom.com/products');
    const data = await response.json();
    
    return data.products.map((product: any) => ({
      url: `https://www.nordstrom.com/s/${product.id}`,
      image: product.defaultImage,
      title: product.name,
      price: product.price.regular,
      description: product.description
    }));
  } catch (error) {
    console.error('Error scraping Nordstrom:', error);
    return [];
  }
}