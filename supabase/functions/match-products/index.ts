import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { query_embedding, match_threshold = 0.5, match_count = 10, store_ids = [] } = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let query = supabaseClient
      .from('products')
      .select(`
        *,
        (1 - (style_embedding <=> '${JSON.stringify(query_embedding)}')) as similarity
      `)
      .gt('similarity', match_threshold)
      .order('similarity', { ascending: false })
      .limit(match_count)

    // Add store filter if store_ids are provided
    if (store_ids.length > 0) {
      query = query.in('store_id', store_ids)
    }

    const { data: matches, error } = await query

    if (error) throw error

    return new Response(
      JSON.stringify({ matches }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})