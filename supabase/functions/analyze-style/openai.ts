import { StyleAnalysis } from '../_shared/types.ts';

export async function analyzeWithOpenAI(imageUrl: string, model = 'gpt-4o-mini'): Promise<StyleAnalysis> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  console.log('Starting OpenAI Vision analysis:', {
    imageUrl,
    model,
    hasApiKey: !!openAIApiKey
  });

  try {
    // First, get detailed style analysis using Vision API
    const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
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
                text: 'Analyze this fashion image and return a JSON object with the following structure:\n{\n  "style_categories": ["casual", "streetwear"],\n  "key_features": ["denim jacket", "white t-shirt"],\n  "color_palette": ["blue", "white"],\n  "occasions": ["casual outings", "street style"],\n  "style_attributes": ["relaxed", "urban"]\n}'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'low'
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
      }),
    });

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('OpenAI Vision API error:', {
        status: visionResponse.status,
        statusText: visionResponse.statusText,
        error: errorText
      });
      throw new Error(`OpenAI Vision API error: ${visionResponse.statusText}`);
    }

    const visionData = await visionResponse.json();
    console.log('OpenAI Vision raw response:', visionData);

    if (!visionData.choices?.[0]?.message?.content) {
      console.error('Invalid response format:', visionData);
      throw new Error('Invalid response format from OpenAI Vision');
    }

    let parsedAnalysis;
    try {
      const content = visionData.choices[0].message.content.trim();
      console.log('Attempting to parse content:', content);
      // Remove any markdown formatting that might be present
      const jsonContent = content.replace(/```json\n?|\n?```/g, '').trim();
      parsedAnalysis = JSON.parse(jsonContent);
      
      // Validate required fields
      if (!parsedAnalysis.style_categories || !Array.isArray(parsedAnalysis.style_categories)) {
        console.error('Invalid analysis structure:', parsedAnalysis);
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

    console.log('Generating embedding for description:', description);

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
      const errorText = await embeddingResponse.text();
      console.error('OpenAI Embedding API error:', {
        status: embeddingResponse.status,
        statusText: embeddingResponse.statusText,
        error: errorText
      });
      throw new Error('Failed to generate embedding');
    }

    const embeddingData = await embeddingResponse.json();
    console.log('Embedding response received:', {
      hasEmbedding: !!embeddingData.data?.[0]?.embedding,
      embeddingLength: embeddingData.data?.[0]?.embedding?.length
    });
    
    if (!embeddingData.data?.[0]?.embedding) {
      console.error('Invalid embedding response:', embeddingData);
      throw new Error('Invalid embedding response format');
    }

    const result: StyleAnalysis = {
      style_tags: [
        ...parsedAnalysis.style_categories,
        ...parsedAnalysis.style_attributes
      ],
      embedding: embeddingData.data[0].embedding,
      confidence_scores: null,
      metadata: {
        provider: 'openai',
        model: model,
        description: description,
        style_categories: parsedAnalysis.style_categories,
        key_features: parsedAnalysis.key_features,
        color_palette: parsedAnalysis.color_palette,
        occasions: parsedAnalysis.occasions,
        style_attributes: parsedAnalysis.style_attributes
      }
    };

    console.log('Analysis complete:', {
      tagsCount: result.style_tags.length,
      hasEmbedding: !!result.embedding,
      hasMetadata: !!result.metadata
    });

    return result;
  } catch (error) {
    console.error('Error in OpenAI analysis:', error);
    throw error;
  }
}