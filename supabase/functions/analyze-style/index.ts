import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { imageUrl } = await req.json()
    
    if (!imageUrl) {
      throw new Error('No image URL provided')
    }

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1]
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader)
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Initialize HuggingFace
    const hf = new HfInference(Deno.env.get('HUGGING_FACE_ACCESS_TOKEN'))
    console.log('Analyzing image:', imageUrl)

    // Get image classification
    const classification = await hf.imageClassification({
      model: 'apple/mobilevitv2-1.0-imagenet1k-256',
      data: await fetch(imageUrl).then(r => r.blob()),
    })

    console.log('Classification results:', classification)

    // Extract style tags from classification
    const styleTags = classification
      .filter(c => c.score > 0.1)
      .map(c => c.label)

    // Update the style_uploads table with analysis results
    const { error: updateError } = await supabaseAdmin
      .from('style_uploads')
      .update({
        metadata: {
          style_tags: styleTags,
          analysis_completed: true,
          analyzed_at: new Date().toISOString(),
        }
      })
      .eq('image_url', imageUrl)
      .eq('user_id', user.id)

    if (updateError) {
      throw updateError
    }

    // Find matching products
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('*')
      .containsAny('style_tags', styleTags)
      .limit(10)

    if (productsError) {
      throw productsError
    }

    // Create product matches
    if (products && products.length > 0) {
      const matches = products.map(product => ({
        user_id: user.id,
        product_url: product.product_url,
        product_image: product.product_image,
        product_title: product.product_title,
        product_price: product.product_price,
        store_name: product.store_name,
        match_score: 0.8, // Simplified score for now
        match_explanation: `Matched based on style tags: ${styleTags.join(', ')}`,
      }))

      const { error: matchError } = await supabaseAdmin
        .from('product_matches')
        .insert(matches)

      if (matchError) {
        throw matchError
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        style_tags: styleTags,
        matches_found: products?.length ?? 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in analyze-style function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})