import { Store, Product } from '../types';
import { scrapeZara } from './zara';
import { scrapeHM } from './hm';
import { scrapeAsos } from './asos';
import { scrapeMango } from './mango';
import { scrapeNike } from './nike';
import { scrapeNordstrom } from './nordstrom';
import { scrapeUniqlo } from './uniqlo';

export async function scrapeStore(store: Store): Promise<Product[]> {
  console.log(`Scraping ${store.name} using ${store.integration_type}`);
  
  try {
    switch (store.name.toLowerCase()) {
      case 'zara':
        return await scrapeZara();
      case 'h&m':
        return await scrapeHM();
      case 'asos':
        return await scrapeAsos();
      case 'mango':
        return await scrapeMango();
      case 'nike':
        return await scrapeNike();
      case 'nordstrom':
        return await scrapeNordstrom();
      case 'uniqlo':
        return await scrapeUniqlo();
      default:
        throw new Error(`Scraper not implemented for ${store.name}`);
    }
  } catch (error) {
    console.error(`Error scraping ${store.name}:`, error);
    throw error;
  }
}