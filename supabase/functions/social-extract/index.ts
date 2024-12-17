import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { getUser } from '../_shared/auth.ts'

serve(async (req) => {
  const corsResult = handleCors(req)
  if (corsResult) return corsResult

  try {
    await getUser(req)
    
    return new Response(
      JSON.stringify({ message: "Social extract not implemented yet" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})