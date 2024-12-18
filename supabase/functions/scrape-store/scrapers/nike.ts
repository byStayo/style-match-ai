import { Product } from '../types';

export async function scrapeNike(): Promise<Product[]> {
  try {
    const response = await fetch('https://api.nike.com/cic/browse/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      body: JSON.stringify({
        queryid: 'products',
        endpoint: '/product_feed/rollup_threads/v2?filter=marketplace(US)&filter=language(en)&filter=employeePrice(true)'
      })
    });

    if (!response.ok) {
      throw new Error(`Nike API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.data.products.map((product: any) => ({
      url: `https://www.nike.com/${product.url}`,
      image: product.images.squarishURL,
      title: product.title,
      price: product.price.currentPrice,
      description: product.description || ''
    }));
  } catch (error) {
    console.error('Error scraping Nike:', error);
    return [];
  }
}