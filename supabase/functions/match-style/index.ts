import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { computeCosineSimilarity } from '../_shared/similarity.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MatchRequest {
  userId?: string;
  socialStyleProfileId?: string;
  storeFilter?: string[];
  minSimilarity?: number;
  limit?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { userId, socialStyleProfileId, storeFilter, minSimilarity = 0.5, limit = 20 } = await req.json() as MatchRequest

    if (!userId && !socialStyleProfileId) {
      throw new Error('Either userId or socialStyleProfileId must be provided')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user style vector
    let styleVector
    let styleMetadata
    
    if (userId) {
      console.log('Fetching user style uploads:', userId)
      const { data: uploads } = await supabase
        .from('style_uploads')
        .select('embedding, metadata')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!uploads?.length) {
        throw new Error('No style uploads found for user')
      }

      // Average the embeddings
      styleVector = uploads.reduce((acc, upload) => {
        const embedding = upload.embedding
        if (!embedding) return acc
        return acc.map((val: number, i: number) => val + embedding[i])
      }, new Array(512).fill(0)).map((val: number) => val / uploads.length)

      // Merge metadata
      styleMetadata = uploads.reduce((acc, upload) => {
        return { ...acc, ...(upload.metadata || {}) }
      }, {})

    } else if (socialStyleProfileId) {
      console.log('Fetching social style profile:', socialStyleProfileId)
      const { data: profile } = await supabase
        .from('social_style_profiles')
        .select('embedding, metadata')
        .eq('id', socialStyleProfileId)
        .single()

      if (!profile?.embedding) {
        throw new Error('Social style profile not found or has no embedding')
      }

      styleVector = profile.embedding
      styleMetadata = profile.metadata
    }

    if (!styleVector) {
      throw new Error('Failed to compute style vector')
    }

    // Get user preferences
    const { data: userPrefs } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', userId)
      .single()

    // Query products with vector similarity
    console.log('Querying products with vector similarity')
    const { data: matches } = await supabase.rpc('match_products', {
      query_embedding: styleVector,
      similarity_threshold: minSimilarity,
      match_count: limit,
      store_filter: storeFilter || []
    })

    if (!matches) {
      throw new Error('Failed to find product matches')
    }

    // Generate explanations and filter based on preferences
    const results = matches
      .filter(product => {
        // Apply preference filters
        if (!userPrefs?.preferences) return true
        const prefs = userPrefs.preferences
        
        // Example: filter by color preferences
        if (prefs.colors?.length > 0) {
          const productColors = product.metadata?.colors || []
          if (!productColors.some((color: string) => prefs.colors.includes(color))) {
            return false
          }
        }
        
        return true
      })
      .map(product => {
        // Generate explanation based on metadata comparison
        let explanation = "This item matches your style"
        
        if (styleMetadata?.colors && product.metadata?.colors) {
          const commonColors = styleMetadata.colors.filter((c: string) => 
            product.metadata.colors.includes(c)
          )
          if (commonColors.length > 0) {
            explanation += ` with similar ${commonColors.join(', ')} tones`
          }
        }

        if (styleMetadata?.patterns && product.metadata?.patterns) {
          const commonPatterns = styleMetadata.patterns.filter((p: string) =>
            product.metadata.patterns.includes(p)
          )
          if (commonPatterns.length > 0) {
            explanation += ` and ${commonPatterns.join(', ')} patterns`
          }
        }

        return {
          ...product,
          explanation,
          similarity: product.similarity
        }
      })

    // Insert matches into product_matches table
    if (userId) {
      const matchInserts = results.map(match => ({
        user_id: userId,
        product_url: match.product_url,
        product_image: match.product_image,
        product_title: match.product_title,
        product_price: match.product_price,
        store_name: match.store_name,
        match_score: match.similarity,
        match_explanation: match.explanation
      }))

      const { error: insertError } = await supabase
        .from('product_matches')
        .upsert(matchInserts, {
          onConflict: 'user_id,product_url'
        })

      if (insertError) {
        console.error('Error inserting matches:', insertError)
      }
    }

    return new Response(
      JSON.stringify({ matches: results }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in match-style function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})