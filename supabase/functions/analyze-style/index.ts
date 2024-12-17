import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2'

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

    // Get user from auth header if available
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1]
    let userId = null;

    if (authHeader) {
      const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader)
      if (!userError && user) {
        userId = user.id;

        // Check user's subscription status and upload count for authenticated users
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('subscription_tier, upload_count')
          .eq('id', user.id)
          .single()

        if (profile) {
          const uploadLimit = profile.subscription_tier === 'premium' ? 1000 : 5
          if (profile.upload_count >= uploadLimit) {
            throw new Error(`Upload limit reached. Please upgrade to premium for more uploads.`)
          }

          // Increment upload count for authenticated users
          await supabaseAdmin
            .from('profiles')
            .update({ upload_count: (profile.upload_count || 0) + 1 })
            .eq('id', user.id)
        }
      }
    }

    // Analyze image based on provider
    const analysis = analysisProvider === 'openai' 
      ? await analyzeWithOpenAI(imageUrl)
      : await analyzeWithHuggingFace(imageUrl)

    // Store analysis results
    if (userId) {
      const { error: updateError } = await supabaseAdmin
        .from('style_uploads')
        .insert({
          user_id: userId,
          image_url: imageUrl,
          upload_type: 'clothing',
          embedding: analysis.embedding,
          metadata: {
            style_tags: analysis.styleTags,
            analysis_completed: true,
            analyzed_at: new Date().toISOString(),
            analysis_provider: analysisProvider,
          }
        })

      if (updateError) throw updateError
    }

    return new Response(
      JSON.stringify({
        success: true,
        style_tags: analysis.styleTags,
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

async function analyzeWithHuggingFace(imageUrl: string) {
  const hf = new HfInference(Deno.env.get('HUGGING_FACE_ACCESS_TOKEN'))
  
  const embedding = await hf.featureExtraction({
    model: 'openai/clip-vit-base-patch32',
    data: imageUrl,
  })

  const classification = await hf.imageClassification({
    model: 'apple/mobilevitv2-1.0-imagenet1k-256',
    data: imageUrl,
  })

  return {
    embedding,
    styleTags: classification
      .filter(c => c.score > 0.1)
      .map(c => c.label),
  }
}

async function analyzeWithOpenAI(imageUrl: string) {
  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiKey) throw new Error('OpenAI API key not configured')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this product image and provide style tags. Format as JSON with "tags" array.',
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      max_tokens: 500,
    }),
  })

  const data = await response.json()
  const analysis = JSON.parse(data.choices[0].message.content)
  
  // Generate a simple embedding (in production, use a proper embedding model)
  const embedding = new Array(512).fill(0)
  
  return {
    embedding,
    styleTags: analysis.tags,
  }
}