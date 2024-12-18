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

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Log scraping start
    const { error: logError } = await supabaseAdmin
      .from('store_scrape_logs')
      .insert({
        store_id: store,
        status: 'processing'
      });

    if (logError) console.error('Error logging scrape start:', logError);

    let products: Product[] = [];
    
    // Scrape products based on store
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

      console.log(`Found ${products.length} products`);

      // Process each product in batches
      const batchSize = 10;
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (product) => {
          try {
            // Analyze product with OpenAI
            console.log('Analyzing product:', product.title);
            const analysis = await analyzeProductWithOpenAI(product.image);

            // Save to products table
            const { error: productError } = await supabaseAdmin
              .from('products')
              .upsert({
                store_name: store,
                product_url: product.url,
                product_image: product.image,
                product_title: product.title,
                product_price: product.price,
                product_description: product.description,
                style_tags: analysis.styleTags,
                style_embedding: analysis.embedding
              }, {
                onConflict: 'product_url'
              });

            if (productError) {
              console.error('Error saving product:', productError);
              throw productError;
            }
          } catch (error) {
            console.error('Error processing product:', error);
          }
        }));

        // Update progress
        console.log(`Processed ${Math.min((i + batchSize), products.length)} of ${products.length} products`);
      }

      // Log successful completion
      await supabaseAdmin
        .from('store_scrape_logs')
        .insert({
          store_id: store,
          status: 'completed',
          metadata: { products_processed: products.length }
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
          products_processed: products.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      // Log failure
      await supabaseAdmin
        .from('store_scrape_logs')
        .insert({
          store_id: store,
          status: 'failed',
          error_message: error.message
        });

      throw error;
    }

  } catch (error) {
    console.error('Error in scrape-store function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});