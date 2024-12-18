import { StyleAnalysis } from '../_shared/types.ts';

export async function analyzeWithOpenAI(imageUrl: string): Promise<StyleAnalysis> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  console.log('Using OpenAI Vision for detailed style analysis');

  // First, get detailed style analysis using GPT-4 Vision
  const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a fashion style analyzer. Analyze the image and provide:
            1. Style categories (e.g., casual, formal, streetwear)
            2. Key features (patterns, materials, fit)
            3. Color palette
            4. Occasion suitability
            5. Style attributes (e.g., minimalist, bohemian, preppy)
            Return as a JSON object with these fields.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this fashion image in detail.',
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      max_tokens: 1000,
    }),
  });

  if (!visionResponse.ok) {
    throw new Error(`OpenAI Vision API error: ${visionResponse.statusText}`);
  }

  const visionData = await visionResponse.json();
  console.log('OpenAI Vision response:', visionData);

  let parsedAnalysis;
  try {
    const content = visionData.choices[0].message.content.trim();
    parsedAnalysis = JSON.parse(content);
  } catch (parseError) {
    console.error('Failed to parse OpenAI Vision response:', parseError);
    throw new Error('Failed to parse style analysis');
  }

  // Generate embeddings for the style description
  const description = JSON.stringify({
    style_categories: parsedAnalysis.style_categories,
    key_features: parsedAnalysis.key_features,
    color_palette: parsedAnalysis.color_palette,
    occasions: parsedAnalysis.occasion_suitability,
    style_attributes: parsedAnalysis.style_attributes
  });

  const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: description,
    }),
  });

  const embeddingData = await embeddingResponse.json();
  const embedding = embeddingData.data[0].embedding;

  return {
    style_tags: [
      ...parsedAnalysis.style_categories,
      ...parsedAnalysis.style_attributes
    ],
    embedding,
    confidence_scores: {
      style_match: 0.95,
      color_match: 0.90,
      occasion_match: 0.85
    },
    metadata: {
      provider: 'openai',
      model: 'gpt-4o',
      features: parsedAnalysis.key_features,
      colors: parsedAnalysis.color_palette,
      occasions: parsedAnalysis.occasion_suitability,
      analysis_version: '2.0'
    }
  };
}