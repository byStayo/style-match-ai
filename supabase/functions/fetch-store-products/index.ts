import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { fetchZaraProducts } from './stores/zara.ts';
import { fetchHMProducts } from './stores/hm.ts';
import { fetchUniqloProducts } from './stores/uniqlo.ts';
import { analyzeProductImage } from './analysis.ts';
import type { Product, StoreProduct } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fetchProductsFromStore(storeName: string): Promise<Product[]> {
  switch (storeName.toLowerCase()) {
    case 'zara':
      return await fetchZaraProducts();
    case 'hm':
      return await fetchHMProducts();
    case 'uniqlo':
      return await fetchUniqloProducts();
    default:
      console.warn(`Store ${storeName} not supported`);
      return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storeName, analysisProvider = 'huggingface' } = await req.json();
    
    if (!storeName) {
      throw new Error('Store name is required');
    }

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch products from store
    console.log('Fetching products from store:', storeName);
    const products = await fetchProductsFromStore(storeName);

    // Process each product
    for (const product of products) {
      console.log('Processing product:', product.title);
      
      // Analyze product image
      const analysis = await analyzeProductImage(product.image, analysisProvider);

      // Save to products table
      const { error: productError } = await supabaseAdmin
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
        }, {
          onConflict: 'product_url'
        });

      if (productError) throw productError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        products_processed: products.length,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in fetch-store-products function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});