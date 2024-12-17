import { StyleAnalysis, STYLE_CATEGORIES } from '../_shared/types.ts';

export async function analyzeWithOpenAI(imageUrl: string): Promise<StyleAnalysis> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  console.log('Using OpenAI Vision for analysis');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            2. Key features (e.g., patterns, materials, fit)
            3. Color palette
            4. Occasion suitability
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

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('OpenAI response:', data);

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response format from OpenAI');
  }

  let parsedAnalysis;
  try {
    const content = data.choices[0].message.content.trim();
    parsedAnalysis = JSON.parse(content);
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', parseError);
    throw new Error('Failed to parse OpenAI response as JSON');
  }

  // Generate embeddings for the style description
  const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: JSON.stringify(parsedAnalysis),
    }),
  });

  const embeddingData = await embeddingResponse.json();
  const embedding = embeddingData.data[0].embedding;

  return {
    style_tags: parsedAnalysis.style_categories,
    embedding,
    confidence_scores: null,
    metadata: {
      provider: 'openai',
      model: 'gpt-4o',
      features: parsedAnalysis.key_features,
      colors: parsedAnalysis.color_palette,
      occasions: parsedAnalysis.occasion_suitability
    }
  };
}