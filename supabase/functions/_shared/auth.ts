import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

export const getUser = async (req: Request) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    throw new Error('Missing Authorization header')
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  )

  const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
  
  if (error) throw error
  if (!user) throw new Error('User not found')
  
  return user
}