import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StoreProduct {
  url: string;
  image: string;
  title: string;
  price: number;
  description?: string;
}

async function fetchZaraProducts(): Promise<StoreProduct[]> {
  console.log('Fetching Zara products...');
  try {
    const response = await fetch('https://www.zara.com/us/en/categories/1030040800/products?ajax=true');
    const data = await response.json();
    
    return data.products.map((product: any) => ({
      url: `https://www.zara.com/us/en/product/${product.seo.keyword}/${product.seo.seoProductId}.html`,
      image: product.images[0].url,
      title: product.name,
      price: product.price / 100, // Convert cents to dollars
      description: product.description
    }));
  } catch (error) {
    console.error('Error fetching Zara products:', error);
    return [];
  }
}

async function fetchHMProducts(): Promise<StoreProduct[]> {
  console.log('Fetching H&M products...');
  try {
    const response = await fetch('https://www2.hm.com/en_us/women/products/view-all.html?sort=stock&image-size=small&image=model&offset=0&page-size=40');
    const html = await response.text();
    
    // Basic HTML parsing (in production, use a proper HTML parser)
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
          price: parseFloat(priceMatch[1]),
        });
      }
    }
    
    return products;
  } catch (error) {
    console.error('Error fetching H&M products:', error);
    return [];
  }
}

async function fetchUniqloProducts(): Promise<StoreProduct[]> {
  console.log('Fetching Uniqlo products...');
  try {
    const response = await fetch('https://www.uniqlo.com/us/api/commerce/v5/en/products?path=women&offset=0&limit=40');
    const data = await response.json();
    
    return data.items.map((item: any) => ({
      url: `https://www.uniqlo.com/us/en/products/${item.productId}`,
      image: item.images.main,
      title: item.name,
      price: item.prices.base,
      description: item.description
    }));
  } catch (error) {
    console.error('Error fetching Uniqlo products:', error);
    return [];
  }
}

async function fetchProductsFromStore(storeName: string): Promise<StoreProduct[]> {
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

async function analyzeProductImage(imageUrl: string, analysisProvider: 'huggingface' | 'openai'): Promise<{
  embedding: number[];
  styleTags: string[];
}> {
  if (analysisProvider === 'openai') {
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) throw new Error('OpenAI API key not configured');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this product image and provide style tags. Format as JSON with "tags" array.',
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
    
    // Generate a simple embedding (in production, use a proper embedding model)
    const embedding = new Array(512).fill(0);
    
    return {
      embedding,
      styleTags: analysis.tags,
    };
  } else {
    const hf = new HfInference(Deno.env.get('HUGGING_FACE_ACCESS_TOKEN'));
    
    const embedding = await hf.featureExtraction({
      model: 'openai/clip-vit-base-patch32',
      data: imageUrl,
    });

    const classification = await hf.imageClassification({
      model: 'apple/mobilevitv2-1.0-imagenet1k-256',
      data: imageUrl,
    });

    return {
      embedding,
      styleTags: classification
        .filter(c => c.score > 0.1)
        .map(c => c.label),
    };
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