import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { computeCosineSimilarity } from '../_shared/similarity.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { styleUploadId, minSimilarity = 0.7, limit = 20, storeFilter = [] } = await req.json();
    
    if (!styleUploadId) {
      throw new Error('Style upload ID is required');
    }

    console.log('Finding matches:', { styleUploadId, minSimilarity, limit, storeFilter });
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the style upload embedding
    const { data: styleUpload, error: uploadError } = await supabase
      .from('style_uploads')
      .select('embedding, metadata')
      .eq('id', styleUploadId)
      .single();

    if (uploadError || !styleUpload?.embedding) {
      console.error('Style upload error:', uploadError);
      throw new Error('Style upload not found or has no embedding');
    }

    console.log('Found style upload with metadata:', styleUpload.metadata);

    // Get products with embeddings, applying store filter if provided
    const productsQuery = supabase
      .from('products')
      .select('*')
      .not('style_embedding', 'is', null);

    if (storeFilter.length > 0) {
      productsQuery.in('store_id', storeFilter);
    }

    const { data: products, error: productsError } = await productsQuery;

    if (productsError) {
      console.error('Products query error:', productsError);
      throw productsError;
    }

    console.log(`Found ${products?.length || 0} products with embeddings`);

    if (!products?.length) {
      return new Response(
        JSON.stringify({ matches: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate similarity scores
    const matches = products
      .map(product => {
        try {
          const similarity = computeCosineSimilarity(
            styleUpload.embedding,
            product.style_embedding
          );

          return {
            ...product,
            similarity,
            confidence_scores: {
              style_match: similarity,
              price_match: calculatePriceMatchScore(product.product_price, styleUpload.metadata?.price_range),
              availability: 1.0
            }
          };
        } catch (error) {
          console.error('Error calculating similarity for product:', product.id, error);
          return null;
        }
      })
      .filter(match => match !== null && match.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    console.log(`Found ${matches.length} matches above similarity threshold`);

    // Generate match explanations
    const matchesWithExplanations = await Promise.all(
      matches.map(async (match) => {
        try {
          const explanation = await generateMatchExplanation(
            styleUpload.metadata,
            match,
            Deno.env.get('OPENAI_API_KEY')
          );
          return { ...match, match_explanation: explanation };
        } catch (error) {
          console.error('Error generating explanation:', error);
          return {
            ...match,
            match_explanation: `This item matches your style with ${Math.round(match.similarity * 100)}% confidence`
          };
        }
      })
    );

    return new Response(
      JSON.stringify({ matches: matchesWithExplanations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in match-products function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function calculatePriceMatchScore(price: number, priceRange?: { min: number; max: number }): number {
  if (!priceRange || !price) return 1.0;
  if (price >= priceRange.min && price <= priceRange.max) return 1.0;
  
  const midPoint = (priceRange.min + priceRange.max) / 2;
  const maxDiff = priceRange.max - priceRange.min;
  const actualDiff = Math.abs(price - midPoint);
  
  return Math.max(0, 1 - (actualDiff / maxDiff));
}

async function generateMatchExplanation(
  styleMetadata: any,
  product: any,
  openAIApiKey: string
): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a fashion expert explaining why items match. Keep explanations concise and natural.'
          },
          {
            role: 'user',
            content: `Explain why these items match:
              Style preferences: ${JSON.stringify(styleMetadata)}
              Product: ${JSON.stringify(product)}
              Similarity score: ${product.similarity}`
          }
        ],
        max_tokens: 100
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating match explanation:', error);
    return `This item matches your style with ${Math.round(product.similarity * 100)}% confidence`;
  }
}