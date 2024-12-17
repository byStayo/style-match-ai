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
    const { styleUploadId, minSimilarity = 0.7, limit = 20 } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the style upload embedding
    const { data: styleUpload, error: styleError } = await supabase
      .from('style_uploads')
      .select('embedding, metadata')
      .eq('id', styleUploadId)
      .single();

    if (styleError || !styleUpload) {
      throw new Error('Style upload not found');
    }

    // Get products with embeddings
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .not('style_embedding', 'is', null);

    if (productsError) {
      throw productsError;
    }

    console.log(`Found ${products.length} products with embeddings`);

    // Calculate similarity scores
    const matches = products
      .map(product => ({
        ...product,
        similarity: computeCosineSimilarity(
          styleUpload.embedding,
          product.style_embedding
        )
      }))
      .filter(product => product.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    console.log(`Found ${matches.length} matches above similarity threshold`);

    // Generate match explanations
    const matchesWithExplanations = matches.map(match => {
      const styleFeatures = styleUpload.metadata?.features || [];
      const productFeatures = match.metadata?.features || [];
      const commonFeatures = styleFeatures.filter(f => 
        productFeatures.includes(f)
      );

      const explanation = commonFeatures.length > 0
        ? `This item matches your style with similar ${commonFeatures.join(', ')}`
        : `This item matches your style preferences with ${Math.round(match.similarity * 100)}% confidence`;

      return {
        ...match,
        match_explanation: explanation
      };
    });

    return new Response(
      JSON.stringify({ matches: matchesWithExplanations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in match-products function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});