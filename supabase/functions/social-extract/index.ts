import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getMediaFromInstagram(accessToken: string, limit = 10) {
  const response = await fetch(
    `https://graph.instagram.com/me/media?fields=id,media_type,media_url&limit=${limit}&access_token=${accessToken}`
  )
  const data = await response.json()
  
  if (data.error) {
    throw new Error(`Instagram API error: ${data.error.message}`)
  }

  return data.data
    .filter((item: any) => item.media_type === 'IMAGE')
    .map((item: any) => item.media_url)
}

async function getImageEmbedding(imageUrl: string): Promise<number[]> {
  console.log('Getting embedding for:', imageUrl)
  
  const hf = new HfInference(Deno.env.get('HUGGING_FACE_ACCESS_TOKEN'))
  const imageData = await fetch(imageUrl).then(r => r.blob())
  
  const embedding = await hf.featureExtraction({
    model: 'openai/clip-vit-base-patch32',
    data: imageData,
  })

  return embedding
}

async function averageEmbeddings(embeddings: number[][]): Promise<number[]> {
  const numDimensions = embeddings[0].length
  const sum = new Array(numDimensions).fill(0)
  
  for (const embedding of embeddings) {
    for (let i = 0; i < numDimensions; i++) {
      sum[i] += embedding[i]
    }
  }
  
  return sum.map(val => val / embeddings.length)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { platform, targetHandle } = await req.json()
    
    if (!platform || !targetHandle) {
      throw new Error('Platform and target handle are required')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1]
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader)
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Get social connection
    const { data: connection, error: connectionError } = await supabase
      .from('social_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .single()

    if (connectionError || !connection) {
      throw new Error(`No ${platform} connection found`)
    }

    // Get media URLs from platform
    const mediaUrls = await getMediaFromInstagram(connection.access_token)
    console.log(`Found ${mediaUrls.length} media items`)

    // Get embeddings for each image
    const embeddings = await Promise.all(
      mediaUrls.map(url => getImageEmbedding(url))
    )
    console.log('Generated embeddings for all media')

    // Average embeddings
    const averagedEmbedding = await averageEmbeddings(embeddings)
    console.log('Calculated average embedding')

    // Store in social_style_profiles
    const { error: profileError } = await supabase
      .from('social_style_profiles')
      .upsert({
        owner_user_id: user.id,
        subject_identifier: targetHandle,
        embedding: averagedEmbedding,
        metadata: {
          platform,
          media_count: mediaUrls.length,
          analyzed_at: new Date().toISOString(),
        }
      })

    if (profileError) {
      throw profileError
    }

    return new Response(
      JSON.stringify({
        success: true,
        media_count: mediaUrls.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in social-extract:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})