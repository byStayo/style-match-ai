import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { computeCosineSimilarity } from '../_shared/similarity.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STYLE_MATCH_WEIGHT = 0.6;
const PRICE_MATCH_WEIGHT = 0.2;
const TAG_MATCH_WEIGHT = 0.2;

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

    // Get user's style upload
    const { data: styleUpload, error: uploadError } = await supabase
      .from('style_uploads')
      .select('embedding, metadata, user_id')
      .eq('id', styleUploadId)
      .single();

    if (uploadError || !styleUpload?.embedding) {
      console.error('Style upload error:', uploadError);
      throw new Error('Style upload not found or has no embedding');
    }

    // Get user's price preferences
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', styleUpload.user_id)
      .single();

    const pricePreferences = userProfile?.preferences?.price_range || { min: 0, max: 1000 };

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
        // Calculate embedding similarity
        const embeddingSimilarity = computeCosineSimilarity(
          styleUpload.embedding,
          product.style_embedding
        );

        // Calculate style tag match
        const styleTagMatch = calculateStyleTagMatch(
          product.style_tags,
          styleUpload.metadata?.style_tags || []
        );

        // Calculate price match
        const priceMatch = calculatePriceMatch(
          product.product_price,
          pricePreferences
        );

        // Calculate weighted score
        const weightedScore = (
          embeddingSimilarity * STYLE_MATCH_WEIGHT +
          styleTagMatch * TAG_MATCH_WEIGHT +
          priceMatch * PRICE_MATCH_WEIGHT
        );

        return {
          ...product,
          similarity: weightedScore,
          confidence_scores: {
            style_match: embeddingSimilarity,
            tag_match: styleTagMatch,
            price_match: priceMatch
          }
        };
      })
      .filter(match => 
        match.similarity >= minSimilarity &&
        (storeFilter.length === 0 || storeFilter.includes(match.store_name))
      )
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    console.log(`Found ${matches.length} matches above similarity threshold`);

    // Store matches
    const matchInserts = matches.map(match => ({
      user_id: styleUpload.user_id,
      product_url: match.product_url,
      product_image: match.product_image,
      product_title: match.product_title,
      product_price: match.product_price,
      store_name: match.store_name,
      match_score: match.similarity,
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

function calculateStyleTagMatch(productTags: string[], userTags: string[]): number {
  if (!productTags?.length || !userTags?.length) return 0.5;
  const commonTags = productTags.filter(tag => userTags.includes(tag));
  return commonTags.length / Math.max(productTags.length, userTags.length);
}

function calculatePriceMatch(price: number, prefs: { min: number; max: number }): number {
  if (!price || !prefs) return 1.0;
  if (price >= prefs.min && price <= prefs.max) return 1.0;
  
  const midPoint = (prefs.min + prefs.max) / 2;
  const maxDiff = prefs.max - prefs.min;
  const actualDiff = Math.abs(price - midPoint);
  
  return Math.max(0, 1 - (actualDiff / maxDiff));
}

function generateMatchExplanation(match: any): string {
  const scores = match.confidence_scores;
  const styleMatch = Math.round(scores.style_match * 100);
  const priceMatch = Math.round(scores.price_match * 100);
  const tagMatch = Math.round(scores.tag_match * 100);
  
  let explanation = `This item matches your style with ${styleMatch}% confidence. `;
  
  if (styleMatch > 80) {
    explanation += `It's a perfect match for your style preferences! `;
  } else if (styleMatch > 60) {
    explanation += `It aligns well with your style preferences. `;
  }
  
  if (priceMatch > 90) {
    explanation += `The price is right within your preferred range. `;
  } else if (priceMatch > 70) {
    explanation += `The price is close to your preferred range. `;
  }
  
  if (tagMatch > 80) {
    explanation += `It matches your preferred style categories perfectly.`;
  } else if (tagMatch > 60) {
    explanation += `It shares several style categories with your preferences.`;
  }
  
  return explanation;
}