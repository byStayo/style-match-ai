import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2';

const STYLE_CATEGORIES = [
  "casual wear", "formal wear", "streetwear", "bohemian", 
  "minimalist", "vintage", "athletic wear", "business casual",
  "evening wear", "summer style", "winter fashion"
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, analysisProvider } = await req.json();
    
    if (!imageUrl) {
      throw new Error('No image URL provided');
    }

    let styleAnalysis;
    
    if (analysisProvider === 'huggingface') {
      console.log('Using HuggingFace for analysis');
      const hfToken = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
      
      if (!hfToken) {
        throw new Error('HuggingFace API token not configured');
      }

      const hf = new HfInference(hfToken);
      
      try {
        // Get style classification
        const classification = await hf.imageClassification({
          model: "apple/mobilevitv2-1.0-imagenet1k-256",
          data: imageUrl,
          parameters: {
            candidate_labels: STYLE_CATEGORIES
          }
        });

        console.log('Classification result:', classification);

        if (!classification || !classification.labels || !classification.scores) {
          throw new Error('Invalid classification response from HuggingFace');
        }

        // Get image embeddings for similarity search
        const embeddingResponse = await hf.featureExtraction({
          model: "openai/clip-vit-base-patch32",
          data: imageUrl,
        });

        console.log('Embedding response received');

        if (!embeddingResponse) {
          throw new Error('Invalid embedding response from HuggingFace');
        }

        styleAnalysis = {
          style_tags: classification.labels,
          embedding: embeddingResponse,
          confidence_scores: classification.scores,
          metadata: {
            provider: 'huggingface',
            model: 'clip-vit-base-patch32',
            classification_model: 'mobilevitv2-1.0'
          }
        };

      } catch (error) {
        console.error('HuggingFace API error:', error);
        throw new Error(`HuggingFace API error: ${error.message}`);
      }

    } else if (analysisProvider === 'openai') {
      console.log('Using OpenAI for analysis');
      const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
      
      if (!openAIApiKey) {
        throw new Error('OpenAI API key not configured');
      }

      try {
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

        styleAnalysis = {
          style_tags: parsedAnalysis.tags,
          embedding: null,
          confidence_scores: null,
          metadata: {
            provider: 'openai',
            model: 'gpt-4o-mini',
            description: parsedAnalysis.description
          }
        };

      } catch (error) {
        console.error('OpenAI API error:', error);
        throw new Error(`OpenAI API error: ${error.message}`);
      }
    } else {
      throw new Error('Invalid analysis provider');
    }

    // Store the analysis results if user is authenticated
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user } } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.split('Bearer ')[1] ?? ''
    );
    
    if (user) {
      console.log('Storing analysis for user:', user.id);
      const { error: uploadError } = await supabase
        .from('style_uploads')
        .insert({
          user_id: user.id,
          image_url: imageUrl,
          upload_type: 'clothing',
          embedding: styleAnalysis.embedding,
          metadata: {
            style_tags: styleAnalysis.style_tags,
            confidence_scores: styleAnalysis.confidence_scores,
            analysis_provider: analysisProvider,
            ...styleAnalysis.metadata
          }
        });

      if (uploadError) {
        console.error('Error storing analysis:', uploadError);
        throw uploadError;
      }
    }

    return new Response(
      JSON.stringify({ success: true, analysis: styleAnalysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-style function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});