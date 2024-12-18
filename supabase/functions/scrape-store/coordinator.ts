import { createClient } from '@supabase/supabase-js';
import { Store, ScrapingStats } from './types';
import { scrapeStore } from './scrapers';
import { processProducts } from './processor';
import { updateScrapingLog } from './logging';

export async function coordinateScraping(
  store: Store,
  supabase: ReturnType<typeof createClient>,
  batchSize: number = 10
): Promise<ScrapingStats> {
  try {
    // Initialize scraping log
    const logEntry = await updateScrapingLog(supabase, {
      store_id: store.id,
      status: 'processing',
      processing_stats: {
        start_time: new Date().toISOString(),
        store: store.name
      }
    });

    // Scrape products
    console.log(`Starting scraping for ${store.name}`);
    const products = await scrapeStore(store);
    
    if (!products?.length) {
      throw new Error('No products found to process');
    }

    console.log(`Found ${products.length} products to process`);

    // Process products in batches
    const stats = await processProducts(products, store, supabase, batchSize);

    // Update final status
    await updateScrapingLog(supabase, {
      id: logEntry.id,
      status: 'completed',
      processing_stats: {
        ...stats,
        end_time: new Date().toISOString()
      }
    });

    return stats;
  } catch (error) {
    console.error(`Error coordinating scraping for ${store.name}:`, error);
    throw error;
  }
}