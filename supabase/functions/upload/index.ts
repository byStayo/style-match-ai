import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'
import { getUser } from '../_shared/auth.ts'

serve(async (req) => {
  const corsResult = handleCors(req)
  if (corsResult) return corsResult

  try {
    const user = await getUser(req)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate a unique file name
    const fileName = `${crypto.randomUUID()}`
    
    // Get the presigned URL
    const { data, error: uploadError } = await supabase
      .storage
      .from('style-uploads')
      .createSignedUrl(`${user.id}/${fileName}`, 60, {
        upsert: true
      })

    if (uploadError) throw uploadError

    // Create a record in the style_uploads table
    const { error: dbError } = await supabase
      .from('style_uploads')
      .insert({
        user_id: user.id,
        image_url: `${user.id}/${fileName}`,
        upload_type: 'clothing', // default type
      })

    if (dbError) throw dbError

    return new Response(
      JSON.stringify({ uploadUrl: data.signedUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})