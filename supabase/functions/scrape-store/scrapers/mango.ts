import { Product } from '../types';

export async function scrapeMango(): Promise<Product[]> {
  try {
    const response = await fetch('https://shop.mango.com/services/productlist/products/US/she');
    const data = await response.json();
    
    return data.products.map((product: any) => ({
      url: `https://shop.mango.com${product.url}`,
      image: product.images[0].src,
      title: product.name,
      price: product.price.value,
      description: product.description
    }));
  } catch (error) {
    console.error('Error scraping Mango:', error);
    return [];
  }
}