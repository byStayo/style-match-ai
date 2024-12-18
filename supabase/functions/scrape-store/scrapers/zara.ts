import { Product } from '../types.ts';

export async function scrapeZara(): Promise<Product[]> {
  console.log('Scraping Zara products...');
  try {
    const response = await fetch('https://www.zara.com/us/en/categories/1030040800/products?ajax=true');
    const data = await response.json();
    
    return data.products.map((product: any) => ({
      url: `https://www.zara.com/us/en/product/${product.seo.keyword}/${product.seo.seoProductId}.html`,
      image: product.images[0].url,
      title: product.name,
      price: product.price / 100,
      description: product.description
    }));
  } catch (error) {
    console.error('Error scraping Zara:', error);
    return [];
  }
}