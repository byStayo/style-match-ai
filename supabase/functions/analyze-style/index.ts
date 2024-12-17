import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalysisResult {
  embedding: number[];
  styleTags: string[];
}

async function analyzeWithHuggingFace(imageData: Blob): Promise<AnalysisResult> {
  const hf = new HfInference(Deno.env.get('HUGGING_FACE_ACCESS_TOKEN'))
  
  const embedding = await hf.featureExtraction({
    model: 'openai/clip-vit-base-patch32',
    data: imageData,
  })

  const classification = await hf.imageClassification({
    model: 'apple/mobilevitv2-1.0-imagenet1k-256',
    data: imageData,
  })

  const styleTags = classification
    .filter(c => c.score > 0.1)
    .map(c => c.label)

  return { embedding, styleTags }
}

async function analyzeWithOpenAI(imageData: Blob): Promise<AnalysisResult> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiKey) throw new Error('OpenAI API key not configured')

  // Convert blob to base64
  const arrayBuffer = await imageData.arrayBuffer()
  const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this image and provide: 1) A list of style tags (colors, patterns, style categories) 2) A detailed description of the style. Format as JSON with "tags" and "description" fields.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    }),
  })

  const data = await response.json()
  
  if (!response.ok) {
    console.error('OpenAI API error:', data)
    throw new Error('Failed to analyze image with OpenAI')
  }

  // Parse the response content as JSON
  const analysis = JSON.parse(data.choices[0].message.content)
  
  // Generate a simple embedding based on the tags (temporary solution)
  // In a production environment, you might want to use a proper embedding model
  const embedding = new Array(512).fill(0) // Matching CLIP's dimension
  
  return {
    embedding,
    styleTags: analysis.tags,
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { imageUrl, analysisProvider = 'huggingface' } = await req.json()
    
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

    // Fetch image data
    console.log('Fetching image:', imageUrl)
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

    // Create product matches
    if (products && products.length > 0) {
      const matches = products.map(product => ({
        user_id: user.id,
        product_url: product.product_url,
        product_image: product.product_image,
        product_title: product.product_title,
        product_price: product.product_price,
        store_name: product.store_name,
        match_score: product.similarity,
        match_explanation: `Matched based on style tags: ${analysis.styleTags.join(', ')}`,
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