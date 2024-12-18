import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/types.ts';
import { analyzeWithHuggingFace } from './huggingface.ts';
import { analyzeWithOpenAI } from './openai.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, visionModel, provider } = await req.json();
    
    if (!imageUrl) {
      throw new Error('No image URL provided');
    }

    if (!provider) {
      throw new Error('No provider specified');
    }

    console.log('Starting analysis with provider:', provider, 'model:', visionModel);
    
    let styleAnalysis;
    try {
      switch (provider.toLowerCase()) {
        case 'huggingface':
          styleAnalysis = await analyzeWithHuggingFace(imageUrl);
          break;
        case 'openai':
          styleAnalysis = await analyzeWithOpenAI(imageUrl, visionModel);
          break;
        case 'anthropic':
          // TODO: Implement Claude vision analysis
          throw new Error('Claude vision analysis not yet implemented');
        case 'google':
          // TODO: Implement Gemini vision analysis
          throw new Error('Gemini vision analysis not yet implemented');
        default:
          throw new Error('Invalid analysis provider');
      }
    } catch (analysisError) {
      console.error('Analysis failed:', analysisError);
      throw new Error(`Analysis failed: ${analysisError.message}`);
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