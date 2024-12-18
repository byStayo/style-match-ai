import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { calculateMatchScore } from './scoring.ts';
import { MatchResult, UserPreferences, MatchOptions } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      styleUploadId, 
      minSimilarity = 0.7, 
      limit = 20,
      options = {} as MatchOptions
    } = await req.json();
    
    if (!styleUploadId) {
      throw new Error('Style upload ID is required');
    }

    console.log('Finding matches:', { styleUploadId, minSimilarity, limit, options });
    
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

    // Get user preferences
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', styleUpload.user_id)
      .single();

    const userPrefs: UserPreferences = {
      priceRange: userProfile?.preferences?.price_range || { min: 0, max: 1000 },
      stylePreferences: userProfile?.preferences?.style_preferences || [],
      colorPreferences: userProfile?.preferences?.color_preferences || [],
      occasionPreferences: userProfile?.preferences?.occasion_preferences || []
    };

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

    // Calculate match scores
    const matches: MatchResult[] = products
      .map(product => {
        const scores = calculateMatchScore(
          styleUpload.embedding,
          product,
          userPrefs,
          options
        );

        return {
          ...product,
          ...scores,
          explanation: generateMatchExplanation(scores)
        };
      })
      .filter(match => match.totalScore >= minSimilarity)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit);

    console.log(`Found ${matches.length} matches above similarity threshold`);

    // Store matches
    const matchInserts = matches.map(match => ({
      user_id: styleUpload.user_id,
      product_id: match.id,
      match_score: match.totalScore,
      match_explanation: match.explanation,
      created_at: new Date().toISOString()
    }));

    await supabase
      .from('style_matches')
      .upsert(matchInserts);

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

function generateMatchExplanation(scores: any): string {
  const parts = [];
  
  if (scores.styleScore > 0.8) {
    parts.push("Strongly matches your style preferences");
  } else if (scores.styleScore > 0.6) {
    parts.push("Aligns well with your style");
  }
  
  if (scores.colorScore > 0.8) {
    parts.push("Perfect color match");
  } else if (scores.colorScore > 0.6) {
    parts.push("Compatible colors");
  }
  
  if (scores.priceScore > 0.8) {
    parts.push("Within your ideal price range");
  }
  
  if (scores.occasionScore > 0.8) {
    parts.push("Perfect for your preferred occasions");
  }
  
  return parts.join(". ") + ".";
}