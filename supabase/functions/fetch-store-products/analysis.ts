import { OpenAIAnalysis } from './types.ts';

export async function analyzeProductWithOpenAI(imageUrl: string): Promise<OpenAIAnalysis> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  console.log('Analyzing product with OpenAI:', imageUrl);

  // First, analyze the image with GPT-4 Vision
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
          content: 'You are a fashion style analyzer. Analyze the image and provide detailed style tags. Return ONLY a JSON object with "tags" array of strings and "description" string.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this fashion product image and provide detailed style tags.',
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

  // Then, generate embeddings for the combined text
  const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: JSON.stringify({
        tags: analysis.tags,
        description: analysis.description,
        url: imageUrl
      }),
    }),
  });

  if (!embeddingResponse.ok) {
    const error = await embeddingResponse.text();
    console.error('OpenAI Embedding API error:', error);
    throw new Error('Failed to generate embeddings');
  }

  const embeddingData = await embeddingResponse.json();
  
  return {
    styleTags: analysis.tags,
    embedding: embeddingData.data[0].embedding
  };
}