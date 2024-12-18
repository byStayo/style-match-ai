import { OpenAIAnalysis } from './types.ts';

export async function analyzeProductWithOpenAI(imageUrl: string): Promise<OpenAIAnalysis> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  console.log('Analyzing product with OpenAI:', imageUrl);

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
          content: 'You are a fashion style analyzer. Analyze the image and provide style tags. Return ONLY a JSON object with "tags" array of strings.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this fashion product image and provide style tags.',
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

  // Get embedding for the image and tags
  const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: JSON.stringify({ tags: analysis.tags, title: imageUrl }),
    }),
  });

  const embeddingData = await embeddingResponse.json();
  
  return {
    styleTags: analysis.tags,
    embedding: embeddingData.data[0].embedding
  };
}