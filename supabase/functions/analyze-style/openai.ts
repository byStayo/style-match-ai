import { StyleAnalysis, STYLE_CATEGORIES } from '../_shared/types.ts';

export async function analyzeWithOpenAI(imageUrl: string): Promise<StyleAnalysis> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  console.log('Using OpenAI for analysis');

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
          content: `You are a fashion style analyzer. Analyze the image and provide style tags from this list: ${STYLE_CATEGORIES.join(', ')}. Return ONLY a JSON object with two fields: "tags" (array of strings) and "description" (string).`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this fashion image and provide style tags.',
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
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('OpenAI response:', data);

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response format from OpenAI');
  }

  let parsedAnalysis;
  try {
    // Try to parse the content directly
    const content = data.choices[0].message.content.trim();
    parsedAnalysis = JSON.parse(content);
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', parseError);
    // Fallback: Try to extract JSON from markdown if present
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      parsedAnalysis = JSON.parse(jsonMatch[1]);
    } else {
      throw new Error('Failed to parse OpenAI response as JSON');
    }
  }

  if (!parsedAnalysis || !Array.isArray(parsedAnalysis.tags)) {
    throw new Error('Invalid analysis format from OpenAI');
  }

  return {
    style_tags: parsedAnalysis.tags,
    embedding: null,
    confidence_scores: null,
    metadata: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      description: parsedAnalysis.description
    }
  };
}