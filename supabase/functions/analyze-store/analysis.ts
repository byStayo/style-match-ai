import { OpenAIAnalysis } from './types.ts';

export async function analyzeProductWithOpenAI(imageUrl: string): Promise<OpenAIAnalysis> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  console.log('Analyzing product with OpenAI:', imageUrl);

  try {
    // Get detailed style analysis using Vision API
    const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are a fashion style analyzer. Analyze the image and provide:
              1. Style categories (e.g., casual, formal, streetwear)
              2. Key features (e.g., patterns, materials, fit)
              3. Color palette
              4. Occasion suitability
              Return as a JSON object with these fields plus a confidence score between 0 and 1.`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this fashion product in detail:' },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ]
      }),
    });

    if (!visionResponse.ok) {
      throw new Error(`OpenAI API error: ${visionResponse.statusText}`);
    }

    const visionData = await visionResponse.json();
    const analysis = JSON.parse(visionData.choices[0].message.content);

    // Generate embeddings for the combined analysis
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: JSON.stringify({
          style_categories: analysis.style_categories,
          key_features: analysis.key_features,
          color_palette: analysis.color_palette,
          occasions: analysis.occasions
        })
      }),
    });

    if (!embeddingResponse.ok) {
      throw new Error('Failed to generate embedding');
    }

    const embeddingData = await embeddingResponse.json();
    
    return {
      styleTags: [
        ...analysis.style_categories,
        ...analysis.key_features
      ],
      embedding: embeddingData.data[0].embedding,
      confidence: analysis.confidence_score || 0.8,
      metadata: {
        style_categories: analysis.style_categories,
        key_features: analysis.key_features,
        color_palette: analysis.color_palette,
        occasions: analysis.occasions,
        analysis_timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error in product analysis:', error);
    throw error;
  }
}