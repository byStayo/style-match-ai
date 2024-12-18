import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2';

export async function analyzeProductImage(
  imageUrl: string, 
  analysisProvider: 'huggingface' | 'openai',
  customOpenAIKey?: string
): Promise<{
  embedding: number[];
  styleTags: string[];
}> {
  console.log('Analyzing product image:', {
    url: imageUrl,
    provider: analysisProvider,
    usingCustomKey: !!customOpenAIKey
  });

  if (analysisProvider === 'openai') {
    const openaiKey = customOpenAIKey || Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) throw new Error('OpenAI API key not configured');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
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

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to analyze image with OpenAI');
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);

    // Generate embeddings
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: JSON.stringify(analysis.tags),
      }),
    });

    if (!embeddingResponse.ok) {
      const error = await embeddingResponse.text();
      console.error('OpenAI Embedding API error:', error);
      throw new Error('Failed to generate embeddings');
    }

    const embeddingData = await embeddingResponse.json();
    
    return {
      embedding: embeddingData.data[0].embedding,
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