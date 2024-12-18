import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { analyzeProductWithOpenAI } from './analysis.ts';
import type { Product } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BATCH_SIZE = 10;
const MIN_CONFIDENCE_SCORE = 0.7;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storeId } = await req.json();
    
    if (!storeId) {
      throw new Error('Store ID is required');
    }

    console.log('Starting product indexing for store:', storeId);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get store details
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      throw new Error('Store not found');
    }

    // Log indexing start
    await supabase
      .from('store_scrape_logs')
      .insert({
        store_id: storeId,
        status: 'processing',
        metadata: { start_time: new Date().toISOString() }
      });

    // Fetch products
    const { data: products, error: fetchError } = await supabase.functions
      .invoke('fetch-store-products', {
        body: { storeName: store.name }
      });

    if (fetchError) throw fetchError;

    console.log(`Fetched ${products?.length || 0} products`);

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process products in batches
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (product: Product) => {
        try {
          console.log(`Processing product ${processedCount + 1}/${products.length}: ${product.title}`);

          // Generate embeddings and analyze with OpenAI
          const analysis = await analyzeProductWithOpenAI(product.image);
          
          if (!analysis.embedding || analysis.confidence < MIN_CONFIDENCE_SCORE) {
            throw new Error(`Low confidence analysis for product: ${product.title}`);
          }

          // Store product with embeddings
          const { error: insertError } = await supabase
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
              created_at: new Date().toISOString()
            });

          if (insertError) throw insertError;

          successCount++;
        } catch (error) {
          console.error(`Error processing product: ${error.message}`);
          errorCount++;
          errors.push(error.message);
        } finally {
          processedCount++;
        }

        // Update progress every 10 products
        if (processedCount % 10 === 0) {
          await supabase
            .from('store_scrape_logs')
            .insert({
              store_id: storeId,
              status: 'processing',
              metadata: {
                progress: (processedCount / products.length) * 100,
                processed: processedCount,
                success: successCount,
                errors: errorCount
              }
            });
        }
      }));
    }

    // Log completion
    await supabase
      .from('store_scrape_logs')
      .insert({
        store_id: storeId,
        status: 'completed',
        metadata: {
          total_products: products.length,
          processed: processedCount,
          success: successCount,
          errors: errorCount,
          error_messages: errors,
          completion_time: new Date().toISOString()
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        successful: successCount,
        failed: errorCount,
        errors: errors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in index-store-products function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});