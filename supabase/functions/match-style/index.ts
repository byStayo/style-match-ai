import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, embedding, similarity_threshold = 0.7, limit = 10 } = await req.json();

    if (!user_id || !embedding) {
      throw new Error('Missing required parameters: user_id or embedding');
    }

    console.log('Matching products for user:', user_id);
    console.log('Similarity threshold:', similarity_threshold);
    console.log('Limit:', limit);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Call the match_products function with the provided embedding
    const { data: matches, error: matchError } = await supabase.rpc(
      'match_products',
      {
        query_embedding: embedding,
        similarity_threshold,
        match_count: limit,
        store_filter: []
      }
    );

    if (matchError) {
      throw matchError;
    }

    console.log(`Found ${matches.length} matches`);

    // Insert matches into product_matches table
    if (matches.length > 0) {
      const { error: insertError } = await supabase
        .from('product_matches')
        .upsert(
          matches.map(match => ({
            user_id,
            product_url: match.product_url,
            product_image: match.product_image,
            product_title: match.product_title,
            product_price: match.product_price,
            store_name: match.store_name,
            match_score: match.similarity,
            match_explanation: `Similarity score: ${(match.similarity * 100).toFixed(1)}%`
          }))
        );

      if (insertError) {
        console.error('Error inserting matches:', insertError);
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({ 
        matches,
        count: matches.length,
        threshold: similarity_threshold
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Error in match-style function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});