import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Product {
  url: string;
  image: string;
  title: string;
  price: number;
  description?: string;
}

async function scrapeZara(): Promise<Product[]> {
  try {
    const response = await fetch('https://www.zara.com/us/en/categories/1030040800/products?ajax=true');
    const data = await response.json();
    
    return data.products.map((product: any) => ({
      url: `https://www.zara.com/us/en/product/${product.seo.keyword}/${product.seo.seoProductId}.html`,
      image: product.images[0].url,
      title: product.name,
      price: product.price / 100,
      description: product.description
    }));
  } catch (error) {
    console.error('Error scraping Zara:', error);
    return [];
  }
}

async function scrapeHM(): Promise<Product[]> {
  try {
    const response = await fetch('https://www2.hm.com/en_us/women/products/view-all.html');
    const html = await response.text();
    const products: Product[] = [];
    
    // Basic HTML parsing (in production, use a proper HTML parser)
    const productMatches = html.match(/<article class="product-item".*?<\/article>/gs) || [];
    
    for (const productHtml of productMatches) {
      const urlMatch = productHtml.match(/href="([^"]+)"/);
      const imageMatch = productHtml.match(/data-src="([^"]+)"/);
      const titleMatch = productHtml.match(/data-title="([^"]+)"/);
      const priceMatch = productHtml.match(/data-price="([^"]+)"/);
      
      if (urlMatch && imageMatch && titleMatch && priceMatch) {
        products.push({
          url: `https://www2.hm.com${urlMatch[1]}`,
          image: imageMatch[1],
          title: titleMatch[1],
          price: parseFloat(priceMatch[1])
        });
      }
    }
    
    return products;
  } catch (error) {
    console.error('Error scraping H&M:', error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { store } = await req.json();
    
    if (!store) {
      throw new Error('Store name is required');
    }

    console.log('Fetching products for store:', store);

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let products: Product[] = [];
    
    // Fetch products based on store
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
      // Call analyze-product function
      const analysis = await supabaseAdmin.functions.invoke('analyze-product', {
        body: { imageUrl: product.image }
      });

      if (!analysis.data) {
        console.warn('No analysis data for product:', product.title);
        continue;
      }

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
          style_tags: analysis.data.analysis.categories,
          metadata: analysis.data.analysis
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
    console.error('Error in fetch-products function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});