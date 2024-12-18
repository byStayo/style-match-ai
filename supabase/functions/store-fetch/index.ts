import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { fetchHMProducts } from '../fetch-store-products/stores/hm.ts'
import { fetchUniqloProducts } from '../fetch-store-products/stores/uniqlo.ts'
import { fetchZaraProducts } from '../fetch-store-products/stores/zara.ts'
import { fetchAsosProducts } from '../fetch-store-products/stores/asos.ts'
import { fetchMangoProducts } from '../fetch-store-products/stores/mango.ts'
import { fetchNikeProducts } from '../fetch-store-products/stores/nike.ts'
import { fetchNordstromProducts } from '../fetch-store-products/stores/nordstrom.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { storeName } = await req.json()
    
    if (!storeName) {
      throw new Error('Store name is required')
    }

    console.log(`Fetching products for store: ${storeName}`)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('name', storeName)
      .single()

    if (storeError || !store) {
      throw new Error(`Store not found: ${storeName}`)
    }

    let products = []
    console.log(`Using ${store.integration_type} integration for ${storeName}`)
    
    switch (storeName.toLowerCase()) {
      case 'h&m':
        products = await fetchHMProducts()
        break
      case 'uniqlo':
        products = await fetchUniqloProducts()
        break
      case 'zara':
        products = await fetchZaraProducts()
        break
      case 'asos':
        products = await fetchAsosProducts()
        break
      case 'mango':
        products = await fetchMangoProducts()
        break
      case 'nike':
        products = await fetchNikeProducts()
        break
      case 'nordstrom':
        products = await fetchNordstromProducts()
        break
      default:
        throw new Error(`Unsupported store: ${storeName}`)
    }

    console.log(`Fetched ${products.length} products from ${storeName}`)

    const { error: insertError } = await supabase
      .from('products')
      .upsert(
        products.map(product => ({
          store_name: storeName,
          product_url: product.url,
          product_image: product.image,
          product_title: product.title,
          product_price: product.price,
          product_description: product.description,
          created_at: new Date().toISOString()
        })),
        { onConflict: 'product_url' }
      )

    if (insertError) {
      throw new Error(`Failed to store products: ${insertError.message}`)
    }

    await supabase
      .from('store_scrape_logs')
      .insert({
        store_id: store.id,
        status: 'success',
        total_products: products.length,
        processed_products: products.length,
        success_count: products.length,
        processing_stats: {
          duration_ms: Date.now() - new Date().getTime(),
          memory_usage: performance.memory?.usedJSHeapSize || 0
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully fetched and stored ${products.length} products from ${storeName}`,
        count: products.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in store-fetch:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})