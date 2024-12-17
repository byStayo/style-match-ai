import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    console.log('Analyzing style for image:', imageUrl);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user ID from the auth token
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1];
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // For now, generate sample matches
    const sampleMatches = [
      {
        user_id: user.id,
        product_url: 'https://example.com/product1',
        product_image: imageUrl,
        product_title: 'Matching Style Item 1',
        product_price: 99.99,
        store_name: 'Fashion Store',
        match_score: 0.95,
        match_explanation: 'Similar color palette and style elements',
      },
      {
        user_id: user.id,
        product_url: 'https://example.com/product2',
        product_image: imageUrl,
        product_title: 'Matching Style Item 2',
        product_price: 79.99,
        store_name: 'Style Boutique',
        match_score: 0.85,
        match_explanation: 'Complementary style elements',
      },
    ];

    // Insert sample matches
    const { error: insertError } = await supabaseClient
      .from('product_matches')
      .insert(sampleMatches);

    if (insertError) {
      console.error('Error inserting matches:', insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true, matchCount: sampleMatches.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-style function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});