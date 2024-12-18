import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { styleUploadId, minSimilarity = 0.7, limit = 20 } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Finding matches for style upload:', styleUploadId);

    // Get the style upload embedding and metadata
    const { data: styleUpload, error: uploadError } = await supabase
      .from('style_uploads')
      .select('embedding, metadata')
      .eq('id', styleUploadId)
      .single();

    if (uploadError || !styleUpload?.embedding) {
      throw new Error('Style upload not found or has no embedding');
    }

    console.log('Style upload metadata:', styleUpload.metadata);

    // Get products with embeddings
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .not('style_embedding', 'is', null);

    if (productsError) throw productsError;

    console.log(`Found ${products?.length || 0} products with embeddings`);

    // Calculate similarity scores and filter matches
    const matches = products
      .map(product => {
        // Calculate embedding similarity
        const embeddingSimilarity = calculateCosineSimilarity(
          styleUpload.embedding,
          product.style_embedding
        );

        // Calculate style tag overlap
        const styleTagOverlap = calculateStyleTagOverlap(
          styleUpload.metadata.style_tags || [],
          product.style_tags || []
        );

        // Calculate color palette similarity
        const colorSimilarity = calculateColorSimilarity(
          styleUpload.metadata.colors || [],
          product.metadata?.colors || []
        );

        // Weighted average of different similarity metrics
        const totalSimilarity = (
          embeddingSimilarity * 0.5 +
          styleTagOverlap * 0.3 +
          colorSimilarity * 0.2
        );

        return {
          ...product,
          similarity: totalSimilarity
        };
      })
      .filter(product => product.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    // Generate match explanations using OpenAI
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const matchesWithExplanations = await Promise.all(
      matches.map(async (match) => {
        const explanation = await generateMatchExplanation(
          styleUpload.metadata,
          match,
          openAIApiKey
        );
        return { 
          ...match,
          match_explanation: explanation,
          confidence_scores: {
            style_match: match.similarity,
            price_match: calculatePriceMatchScore(match.product_price),
            availability: 1.0
          }
        };
      })
    );

    return new Response(
      JSON.stringify({ matches: matchesWithExplanations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in match-products function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

function calculateStyleTagOverlap(tags1: string[], tags2: string[]): number {
  const set1 = new Set(tags1.map(t => t.toLowerCase()));
  const set2 = new Set(tags2.map(t => t.toLowerCase()));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

function calculateColorSimilarity(colors1: string[], colors2: string[]): number {
  if (!colors1.length || !colors2.length) return 0;
  const set1 = new Set(colors1.map(c => c.toLowerCase()));
  const set2 = new Set(colors2.map(c => c.toLowerCase()));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  return intersection.size / Math.max(set1.size, set2.size);
}

function calculatePriceMatchScore(price: number): number {
  // Implement price range matching logic
  return price > 0 ? 1.0 : 0.0;
}

async function generateMatchExplanation(
  styleMetadata: any,
  product: any,
  openAIApiKey: string
): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a fashion expert explaining why items match. Keep explanations concise and natural.'
          },
          {
            role: 'user',
            content: `Explain why these items match:
              Style preferences: ${JSON.stringify(styleMetadata)}
              Product: ${JSON.stringify(product)}
              Similarity score: ${product.similarity}`
          }
        ],
        max_tokens: 100
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating match explanation:', error);
    return `This item matches your style with ${Math.round(product.similarity * 100)}% confidence`;
  }
}