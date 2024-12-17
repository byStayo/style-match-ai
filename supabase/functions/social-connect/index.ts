import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

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
    const { platform } = await req.json()
    
    if (!platform) {
      throw new Error('Platform is required')
    }

    // Initialize Supabase client
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

    // Generate OAuth URL based on platform
    let oauthUrl: string
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/social-callback`

    switch (platform) {
      case 'instagram':
        const instagramClientId = Deno.env.get('INSTAGRAM_CLIENT_ID')
        if (!instagramClientId) throw new Error('Instagram client ID not configured')
        
        oauthUrl = `https://api.instagram.com/oauth/authorize?` +
          `client_id=${instagramClientId}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `scope=user_profile,user_media&` +
          `response_type=code&` +
          `state=${user.id}`
        break

      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }

    return new Response(
      JSON.stringify({ url: oauthUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in social-connect:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})