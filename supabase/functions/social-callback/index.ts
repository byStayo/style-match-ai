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
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state') // This contains the user ID
    const error = url.searchParams.get('error')

    if (error) {
      throw new Error(`OAuth error: ${error}`)
    }

    if (!code || !state) {
      throw new Error('Missing code or state parameter')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Exchange code for access token
    const instagramClientId = Deno.env.get('INSTAGRAM_CLIENT_ID')
    const instagramClientSecret = Deno.env.get('INSTAGRAM_CLIENT_SECRET')
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/social-callback`

    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: instagramClientId!,
        client_secret: instagramClientSecret!,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      }),
    })

    const tokenData = await tokenResponse.json()
    
    if (tokenData.error) {
      throw new Error(`Token exchange error: ${tokenData.error_message}`)
    }

    // Get long-lived access token
    const longLivedTokenResponse = await fetch(
      `https://graph.instagram.com/access_token?` +
      `grant_type=ig_exchange_token&` +
      `client_secret=${instagramClientSecret}&` +
      `access_token=${tokenData.access_token}`
    )

    const longLivedTokenData = await longLivedTokenResponse.json()

    if (longLivedTokenData.error) {
      throw new Error(`Long-lived token error: ${longLivedTokenData.error.message}`)
    }

    // Store connection in database
    const { error: dbError } = await supabase
      .from('social_connections')
      .upsert({
        user_id: state,
        platform: 'instagram',
        platform_user_id: tokenData.user_id.toString(),
        access_token: longLivedTokenData.access_token,
        connected_at: new Date().toISOString(),
      })

    if (dbError) {
      throw dbError
    }

    // Redirect back to app with success message
    const appUrl = new URL(Deno.env.get('APP_URL') ?? '/')
    appUrl.searchParams.set('social_connect', 'success')
    
    return Response.redirect(appUrl.toString(), 302)

  } catch (error) {
    console.error('Error in social-callback:', error)
    const appUrl = new URL(Deno.env.get('APP_URL') ?? '/')
    appUrl.searchParams.set('social_connect', 'error')
    appUrl.searchParams.set('error_message', error.message)
    
    return Response.redirect(appUrl.toString(), 302)
  }
})