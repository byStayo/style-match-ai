import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { analyzeProductWithOpenAI } from './analysis.ts';
import { processBatch } from './batch.ts';
import { StoreStats, ProcessingResult } from './types.ts';

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

    console.log('Starting store analysis:', storeId);

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

    // Initialize stats
    const stats: StoreStats = {
      total_products: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      start_time: new Date().toISOString()
    };

    // Log analysis start
    const { data: logEntry } = await supabase
      .from('store_scrape_logs')
      .insert({
        store_id: storeId,
        status: 'processing',
        processing_stats: stats
      })
      .select()
      .single();

    if (!logEntry) {
      throw new Error('Failed to create log entry');
    }

    // Get products to analyze
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('store_name', store.name)
      .is('style_embedding', null);

    if (!products?.length) {
      console.log('No products to analyze');
      return new Response(
        JSON.stringify({ message: 'No products to analyze' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    stats.total_products = products.length;
    console.log(`Found ${products.length} products to analyze`);

    // Process products in batches
    const results = await processBatch(products, async (product) => {
      try {
        console.log(`Analyzing product: ${product.product_title}`);
        const analysis = await analyzeProductWithOpenAI(product.product_image);
        
        const { error: updateError } = await supabase
          .from('products')
          .update({
            style_embedding: analysis.embedding,
            style_tags: analysis.styleTags,
            confidence_score: analysis.confidence,
            last_indexed_at: new Date().toISOString()
          })
          .eq('id', product.id);

        if (updateError) throw updateError;
        
        return { success: true, productId: product.id };
      } catch (error) {
        console.error(`Error analyzing product ${product.id}:`, error);
        return { success: false, productId: product.id, error: error.message };
      }
    }, async (processed: number) => {
      // Update progress
      stats.processed = processed;
      await supabase
        .from('store_scrape_logs')
        .update({ processing_stats: stats })
        .eq('id', logEntry.id);
    });

    // Calculate final stats
    stats.successful = results.filter(r => r.success).length;
    stats.failed = results.filter(r => !r.success).length;
    stats.end_time = new Date().toISOString();

    // Log completion
    await supabase
      .from('store_scrape_logs')
      .update({
        status: 'completed',
        processing_stats: stats
      })
      .eq('id', logEntry.id);

    return new Response(
      JSON.stringify({ success: true, stats }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-store function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});