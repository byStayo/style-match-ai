import { createClient } from '@supabase/supabase-js';
import { Product, Store, ScrapingStats } from './types';
import { analyzeProductWithOpenAI } from './analysis';
import { sleep } from './utils';

const RATE_LIMIT_DELAY = 1000; // 1 second between batches

export async function processProducts(
  products: Product[],
  store: Store,
  supabase: ReturnType<typeof createClient>,
  batchSize: number
): Promise<ScrapingStats> {
  const stats: ScrapingStats = {
    total_products: products.length,
    processed: 0,
    successful: 0,
    failed: 0
  };

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (product) => {
      try {
        console.log(`Processing product ${stats.processed + 1}/${products.length}: ${product.title}`);
        
        const analysis = await analyzeProductWithOpenAI(product.image);
        
        if (!analysis.embedding || !analysis.styleTags) {
          throw new Error('Invalid analysis result');
        }

        await supabase
          .from('products')
          .upsert({
            store_name: store.name,
            product_url: product.url,
            product_image: product.image,
            product_title: product.title,
            product_price: product.price,
            product_description: product.description,
            style_tags: analysis.styleTags,
            style_embedding: analysis.embedding,
            confidence_score: analysis.confidence,
            last_indexed_at: new Date().toISOString()
          });
        
        stats.successful++;
      } catch (error) {
        console.error('Error processing product:', error);
        stats.failed++;
      } finally {
        stats.processed++;
      }
    }));

    // Rate limiting between batches
    if (i + batchSize < products.length) {
      await sleep(RATE_LIMIT_DELAY);
    }
  }

  return stats;
}