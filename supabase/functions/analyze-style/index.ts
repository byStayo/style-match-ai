import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { imageUrl, analysisProvider = 'huggingface' } = await req.json()
    
    if (!imageUrl) {
      throw new Error('No image URL provided')
    }

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

    // Check user's subscription status and upload count
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('subscription_tier, upload_count')
      .eq('id', user.id)
      .single()

    if (!profile) {
      throw new Error('User profile not found')
    }

    const uploadLimit = profile.subscription_tier === 'premium' ? 1000 : 5
    if (profile.upload_count >= uploadLimit) {
      throw new Error(`Upload limit reached. Please upgrade to premium for more uploads.`)
    }

    // Increment upload count
    await supabaseAdmin
      .from('profiles')
      .update({ upload_count: (profile.upload_count || 0) + 1 })
      .eq('id', user.id)

    // Fetch image data
    const imageData = await fetch(imageUrl).then(r => r.blob())
    
    // Analyze image based on provider
    const analysis = analysisProvider === 'openai' 
      ? await analyzeWithOpenAI(imageData)
      : await analyzeWithHuggingFace(imageData)

    // Update the style_uploads table with analysis results
    const { error: updateError } = await supabaseAdmin
      .from('style_uploads')
      .update({
        embedding: analysis.embedding,
        metadata: {
          style_tags: analysis.styleTags,
          analysis_completed: true,
          analyzed_at: new Date().toISOString(),
          analysis_provider: analysisProvider,
        }
      })
      .eq('image_url', imageUrl)
      .eq('user_id', user.id)

    if (updateError) {
      throw updateError
    }

    // Find matching products using vector similarity
    const { data: products, error: productsError } = await supabaseAdmin
      .rpc('match_products', {
        query_embedding: analysis.embedding,
        similarity_threshold: 0.7,
        match_count: 10
      })

    if (productsError) {
      throw productsError
    }

    return new Response(
      JSON.stringify({
        success: true,
        style_tags: analysis.styleTags,
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
