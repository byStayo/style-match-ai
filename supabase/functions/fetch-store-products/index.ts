import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
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
    const { storeName, userId } = await req.json();
    
    if (!storeName) {
      throw new Error('Store name is required');
    }

    console.log('Starting product fetch for store:', storeName);

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Log scraping start
    const { error: logError } = await supabaseAdmin
      .from('store_scrape_logs')
      .insert({
        store_id: storeName,
        status: 'processing'
      });

    if (logError) console.error('Error logging scrape start:', logError);

    // Fetch products from store API/scraper
    const { data: products, error: fetchError } = await supabaseAdmin.functions
      .invoke('scrape-store', {
        body: { store: storeName }
      });

    if (fetchError) throw fetchError;

    console.log(`Found ${products?.length || 0} products`);

    // Process products in batches
    const batchSize = 10;
    let processedCount = 0;
    
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (product: Product) => {
        try {
          console.log('Processing product:', product.title);
          
          // Generate embeddings and analyze with OpenAI
          const analysis = await analyzeProductWithOpenAI(product.image);

          // Store product with embeddings
          const { error: insertError } = await supabaseAdmin
            .from('products')
            .upsert({
              store_name: storeName,
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

          processedCount++;
          console.log(`Processed ${processedCount}/${products.length} products`);
        } catch (error) {
          console.error('Error processing product:', error);
        }
      }));
    }

    // Log completion
    const { error: completeError } = await supabaseAdmin
      .from('store_scrape_logs')
      .insert({
        store_id: storeName,
        status: 'completed',
        metadata: {
          products_processed: processedCount,
          total_products: products.length
        }
      });

    if (completeError) console.error('Error logging completion:', completeError);

    // If userId provided, trigger matching
    if (userId) {
      console.log('Triggering product matching for user:', userId);
      
      // Get user's style uploads
      const { data: uploads } = await supabaseAdmin
        .from('style_uploads')
        .select('embedding')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (uploads?.length) {
        // Average user's style embeddings
        const userStyleVector = uploads.reduce((acc, upload) => {
          const embedding = upload.embedding;
          if (!embedding) return acc;
          return acc.map((val: number, i: number) => val + embedding[i]);
        }, new Array(512).fill(0)).map((val: number) => val / uploads.length);

        // Find matches
        const { data: matches } = await supabaseAdmin.rpc('match_products', {
          query_embedding: userStyleVector,
          similarity_threshold: 0.7,
          match_count: 20
        });

        if (matches?.length) {
          // Store matches
          const matchInserts = matches.map((match: any) => ({
            user_id: userId,
            product_url: match.product_url,
            product_image: match.product_image,
            product_title: match.product_title,
            product_price: match.product_price,
            store_name: match.store_name,
            match_score: match.similarity,
            match_explanation: `This item matches your style with ${Math.round(match.similarity * 100)}% confidence.`
          }));

          await supabaseAdmin
            .from('product_matches')
            .upsert(matchInserts);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        products_processed: processedCount,
        total_products: products.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-store-products function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});