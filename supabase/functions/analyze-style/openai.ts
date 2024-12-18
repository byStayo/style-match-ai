import { StyleAnalysis } from '../_shared/types.ts';

export async function analyzeWithOpenAI(imageUrl: string, model = 'gpt-4-vision-preview'): Promise<StyleAnalysis> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  console.log('Starting OpenAI Vision analysis for:', imageUrl, 'with model:', model);

  try {
    // First, get detailed style analysis using GPT-4 Vision
    const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: 'system',
            content: 'You are a fashion style analyzer. Analyze the image and provide a detailed analysis in a specific JSON format.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this fashion image and return ONLY a JSON object with the following structure:\n{\n  "style_categories": string[],\n  "key_features": string[],\n  "color_palette": string[],\n  "occasions": string[],\n  "style_attributes": string[]\n}'
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        max_tokens: 1000,
      }),
    });

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('OpenAI Vision API error:', errorText);
      throw new Error(`OpenAI Vision API error: ${visionResponse.statusText}`);
    }

    const visionData = await visionResponse.json();
    console.log('OpenAI Vision raw response:', visionData);

    if (!visionData.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI Vision');
    }

    let parsedAnalysis;
    try {
      const content = visionData.choices[0].message.content.trim();
      parsedAnalysis = JSON.parse(content);
      
      // Validate required fields
      if (!parsedAnalysis.style_categories || !Array.isArray(parsedAnalysis.style_categories)) {
        throw new Error('Missing or invalid style_categories in analysis');
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI Vision response:', parseError);
      console.error('Raw content:', visionData.choices[0].message.content);
      throw new Error('Failed to parse style analysis');
    }

    // Generate embeddings for the style description
    const description = JSON.stringify({
      style_categories: parsedAnalysis.style_categories,
      key_features: parsedAnalysis.key_features,
      color_palette: parsedAnalysis.color_palette,
      occasions: parsedAnalysis.occasions,
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

    if (!embeddingResponse.ok) {
      console.error('OpenAI Embedding API error:', await embeddingResponse.text());
      throw new Error('Failed to generate embedding');
    }

    const embeddingData = await embeddingResponse.json();
    
    if (!embeddingData.data?.[0]?.embedding) {
      throw new Error('Invalid embedding response format');
    }

    return {
      style_tags: [
        ...parsedAnalysis.style_categories,
        ...parsedAnalysis.style_attributes
      ],
      embedding: embeddingData.data[0].embedding,
      confidence_scores: null,
      metadata: {
        provider: 'openai',
        model: "gpt-4-vision-preview",
        description: description,
        style_categories: parsedAnalysis.style_categories,
        key_features: parsedAnalysis.key_features,
        color_palette: parsedAnalysis.color_palette,
        occasions: parsedAnalysis.occasions,
        style_attributes: parsedAnalysis.style_attributes
      }
    };
  } catch (error) {
    console.error('Error in OpenAI analysis:', error);
    throw error;
  }
}