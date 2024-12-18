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
    const { store } = await req.json();
    
    if (!store) {
      throw new Error('Store name is required');
    }

    console.log('Scraping products for store:', store);

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let products: Product[] = [];
    
    // Scrape products based on store
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

    // Process each product
    for (const product of products) {
      // Analyze product with OpenAI
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
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        products_processed: products.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

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