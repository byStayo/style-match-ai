import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
  console.log('Scraping Zara products...');
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
  console.log('Scraping H&M products...');
  try {
    const response = await fetch('https://www2.hm.com/en_us/women/products/view-all.html');
    const html = await response.text();
    const products = [];
    
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

async function analyzeProductWithOpenAI(imageUrl: string): Promise<{ styleTags: string[], embedding: number[] }> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  console.log('Analyzing product with OpenAI:', imageUrl);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a fashion style analyzer. Analyze the image and provide style tags. Return ONLY a JSON object with "tags" array of strings.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this fashion product image and provide style tags.',
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      max_tokens: 500,
    }),
  });

  const data = await response.json();
  const analysis = JSON.parse(data.choices[0].message.content);

  // Get embedding for the image and tags
  const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: JSON.stringify({ tags: analysis.tags, title: imageUrl }),
    }),
  });

  const embeddingData = await embeddingResponse.json();
  
  return {
    styleTags: analysis.tags,
    embedding: embeddingData.data[0].embedding
  };
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