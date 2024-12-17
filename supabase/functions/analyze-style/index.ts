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

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Here we would normally:
    // 1. Call OpenAI's CLIP API to get image embeddings
    // 2. Compare embeddings with product database
    // 3. Insert matches into product_matches table
    
    // For now, let's insert some sample matches
    const sampleMatches = [
      {
        product_url: 'https://example.com/product1',
        product_image: imageUrl, // Using the uploaded image as a placeholder
        product_title: 'Sample Product 1',
        product_price: 99.99,
        store_name: 'Sample Store',
        match_score: 0.95,
        match_explanation: 'Similar style and color pattern',
      },
      {
        product_url: 'https://example.com/product2',
        product_image: imageUrl,
        product_title: 'Sample Product 2',
        product_price: 79.99,
        store_name: 'Sample Store',
        match_score: 0.85,
        match_explanation: 'Matching color scheme',
      },
    ];

    // Get user ID from the auth token
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1];
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Insert sample matches
    const { error: insertError } = await supabaseClient
      .from('product_matches')
      .insert(sampleMatches.map(match => ({
        ...match,
        user_id: user.id,
      })));

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});