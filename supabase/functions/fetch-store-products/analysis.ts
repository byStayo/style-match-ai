import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2';
import { Product } from './types.ts';

export async function analyzeProductImage(
  imageUrl: string, 
  analysisProvider: 'huggingface' | 'openai'
): Promise<{
  embedding: number[];
  styleTags: string[];
}> {
  if (analysisProvider === 'openai') {
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) throw new Error('OpenAI API key not configured');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this product image and provide style tags. Format as JSON with "tags" array.',
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);
    
    // Generate a simple embedding (in production, use a proper embedding model)
    const embedding = new Array(512).fill(0);
    
    return {
      embedding,
      styleTags: analysis.tags,
    };
  } else {
    const hf = new HfInference(Deno.env.get('HUGGING_FACE_ACCESS_TOKEN'));
    
    const embedding = await hf.featureExtraction({
      model: 'openai/clip-vit-base-patch32',
      data: imageUrl,
    });

    const classification = await hf.imageClassification({
      model: 'apple/mobilevitv2-1.0-imagenet1k-256',
      data: imageUrl,
    });

    return {
      embedding,
      styleTags: classification
        .filter((c: any) => c.score > 0.1)
        .map((c: any) => c.label),
    };
  }
}