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
      .select('embedding, metadata, user_id')
      .eq('id', styleUploadId)
      .single();

    if (uploadError || !styleUpload?.embedding) {
      console.error('Style upload error:', uploadError);
      throw new Error('Style upload not found or has no embedding');
    }

    // Get products with embeddings
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .not('style_embedding', 'is', null);

    if (productsError) {
      console.error('Products query error:', productsError);
      throw productsError;
    }

    console.log(`Found ${products?.length || 0} products with embeddings`);

    // Calculate similarity scores and filter matches
    const matches = products
      .map(product => {
        const similarity = computeCosineSimilarity(
          styleUpload.embedding,
          product.style_embedding
        );

        const styleMatch = calculateStyleMatch(
          product.style_tags,
          styleUpload.metadata?.style_tags || []
        );

        const priceMatch = calculatePriceMatch(
          product.product_price,
          styleUpload.metadata?.price_range
        );

        const confidenceScore = (similarity + styleMatch + priceMatch) / 3;

        return {
          ...product,
          similarity,
          confidence_scores: {
            style_match: styleMatch,
            price_match: priceMatch,
            similarity
          },
          match_score: confidenceScore
        };
      })
      .filter(match => match.match_score >= minSimilarity)
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, limit);

    console.log(`Found ${matches.length} matches above similarity threshold`);

    // Store matches in product_matches table
    const matchInserts = matches.map(match => ({
      user_id: styleUpload.user_id,
      product_url: match.product_url,
      product_image: match.product_image,
      product_title: match.product_title,
      product_price: match.product_price,
      store_name: match.store_name,
      match_score: match.match_score,
      match_explanation: generateMatchExplanation(match)
    }));

    const { error: insertError } = await supabase
      .from('product_matches')
      .upsert(matchInserts);

    if (insertError) {
      console.error('Error inserting matches:', insertError);
    }

    return new Response(
      JSON.stringify({ matches }),
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

function calculateStyleMatch(productTags: string[], userTags: string[]): number {
  if (!productTags?.length || !userTags?.length) return 0.5;
  const commonTags = productTags.filter(tag => userTags.includes(tag));
  return commonTags.length / Math.max(productTags.length, userTags.length);
}

function calculatePriceMatch(price: number, priceRange?: { min: number; max: number }): number {
  if (!priceRange || !price) return 1.0;
  if (price >= priceRange.min && price <= priceRange.max) return 1.0;
  
  const midPoint = (priceRange.min + priceRange.max) / 2;
  const maxDiff = priceRange.max - priceRange.min;
  const actualDiff = Math.abs(price - midPoint);
  
  return Math.max(0, 1 - (actualDiff / maxDiff));
}

function generateMatchExplanation(match: any): string {
  const confidence = Math.round(match.match_score * 100);
  const styleMatch = Math.round(match.confidence_scores.style_match * 100);
  
  let explanation = `This ${match.product_title} matches your style with ${confidence}% confidence. `;
  
  if (styleMatch > 80) {
    explanation += `It strongly matches your style preferences (${styleMatch}% style match).`;
  } else if (styleMatch > 60) {
    explanation += `It has several style elements that align with your preferences (${styleMatch}% style match).`;
  } else {
    explanation += `It has some style elements that might interest you (${styleMatch}% style match).`;
  }

  return explanation;
}