import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storeId } = await req.json();
    
    if (!storeId) {
      throw new Error('Store ID is required');
    }

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

    console.log('Starting product indexing for store:', store.name);

    // Fetch products using the appropriate method
    const { data: products, error: fetchError } = await supabase.functions
      .invoke('fetch-store-products', {
        body: { 
          storeName: store.name,
          analysisProvider: 'openai'
        }
      });

    if (fetchError) throw fetchError;

    console.log(`Fetched ${products?.length || 0} products`);

    // Process products in batches
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < products.length; i += batchSize) {
      batches.push(products.slice(i, i + batchSize));
    }

    let processedCount = 0;
    for (const batch of batches) {
      const batchPromises = batch.map(async (product: any) => {
        try {
          // Generate embeddings for product
          const { data: analysis, error: analysisError } = await supabase.functions
            .invoke('analyze-product', {
              body: { imageUrl: product.image }
            });

          if (analysisError) throw analysisError;

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
              style_tags: analysis.style_tags,
              style_embedding: analysis.embedding
            });

          if (insertError) throw insertError;

          processedCount++;
          console.log(`Processed ${processedCount}/${products.length} products`);
        } catch (error) {
          console.error('Error processing product:', error);
        }
      });

      await Promise.all(batchPromises);
    }

    // Log completion
    const { error: logError } = await supabase
      .from('store_scrape_logs')
      .insert({
        store_id: storeId,
        status: 'completed',
        metadata: {
          products_processed: processedCount,
          total_products: products.length
        }
      });

    if (logError) console.error('Error logging completion:', logError);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedCount,
        total: products.length 
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