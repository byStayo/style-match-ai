import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { scrapeZara } from './scrapers/zara.ts';
import { scrapeHM } from './scrapers/hm.ts';
import { analyzeProductWithOpenAI } from './analysis.ts';
import type { Product } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BATCH_SIZE = 10;
const RATE_LIMIT_DELAY = 1000; // 1 second between batches

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { store, userId } = await req.json();
    
    if (!store) {
      throw new Error('Store name is required');
    }

    console.log('Starting product indexing for store:', store);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create a new scrape log entry
    const { data: logEntry, error: logError } = await supabaseAdmin
      .from('store_scrape_logs')
      .insert({
        store_id: store,
        status: 'processing',
        batch_id: crypto.randomUUID(),
        processing_stats: {
          start_time: new Date().toISOString(),
          store: store,
          user_id: userId
        }
      })
      .select()
      .single();

    if (logError) throw logError;

    // Scrape products
    let products: Product[] = [];
    try {
      switch (store.toLowerCase()) {
        case 'zara':
          products = await scrapeZara();
          break;
        case 'h&m':
          products = await scrapeHM();
          break;
        default:
          throw new Error(`Store ${store} not supported`);
      }
    } catch (error) {
      console.error(`Error scraping ${store}:`, error);
      await updateScrapeLog(supabaseAdmin, logEntry.id, 'failed', {
        error: error.message,
        end_time: new Date().toISOString()
      });
      throw error;
    }

    console.log(`Found ${products.length} products to process`);

    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;

    // Process products in batches
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);
      
      // Update progress
      await updateScrapeLog(supabaseAdmin, logEntry.id, 'processing', {
        total_products: products.length,
        processed_products: processedCount,
        success_count: successCount,
        failed_count: failedCount
      });

      // Process batch
      await Promise.all(batch.map(async (product) => {
        try {
          console.log(`Processing product ${processedCount + 1}/${products.length}: ${product.title}`);
          
          // Analyze product with OpenAI
          const analysis = await analyzeProductWithOpenAI(product.image);
          
          if (!analysis.embedding || !analysis.styleTags) {
            throw new Error('Invalid analysis result');
          }

          // Calculate confidence score
          const confidenceScore = analysis.confidence || 0.8;

          // Store product with embeddings
          const { error: insertError } = await supabaseAdmin
            .from('products')
            .upsert({
              store_name: store,
              product_url: product.url,
              product_image: product.image,
              product_title: product.title,
              product_price: product.price,
              product_description: product.description,
              style_tags: analysis.styleTags,
              style_embedding: analysis.embedding,
              confidence_score: confidenceScore,
              last_indexed_at: new Date().toISOString(),
              matching_weights: {
                style: 0.6,
                tags: 0.2,
                price: 0.2
              }
            });

          if (insertError) throw insertError;
          
          successCount++;
        } catch (error) {
          console.error('Error processing product:', error);
          failedCount++;
        } finally {
          processedCount++;
        }
      }));

      // Rate limiting between batches
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
    }

    // Update final status
    await updateScrapeLog(supabaseAdmin, logEntry.id, 'completed', {
      end_time: new Date().toISOString(),
      total_products: products.length,
      processed_products: processedCount,
      success_count: successCount,
      failed_count: failedCount
    });

    // If userId provided, trigger matching
    if (userId) {
      console.log('Triggering product matching for user:', userId);
      await supabaseAdmin.functions.invoke('match-products', {
        body: { 
          userId,
          storeFilter: [store],
          minSimilarity: 0.7,
          limit: 20
        }
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_products: products.length,
        processed: processedCount,
        successful: successCount,
        failed: failedCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scrape-store function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function updateScrapeLog(
  supabase: any,
  logId: string,
  status: string,
  stats: Record<string, any>
) {
  const { error } = await supabase
    .from('store_scrape_logs')
    .update({
      status,
      processing_stats: stats,
      updated_at: new Date().toISOString()
    })
    .eq('id', logId);

  if (error) {
    console.error('Error updating scrape log:', error);
  }
}