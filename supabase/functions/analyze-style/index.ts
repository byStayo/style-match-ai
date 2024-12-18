import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/types.ts';
import { analyzeWithOpenAI } from './openai.ts';
import { analyzeWithHuggingFace } from './huggingface.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, visionModel = 'gpt-4o-mini', provider = 'openai' } = await req.json();
    
    if (!imageUrl) {
      throw new Error('No image URL provided');
    }

    console.log('Starting analysis:', {
      provider,
      model: visionModel,
      imageUrl
    });
    
    let styleAnalysis;
    try {
      switch (provider.toLowerCase()) {
        case 'huggingface':
          styleAnalysis = await analyzeWithHuggingFace(imageUrl);
          break;
        case 'openai':
          styleAnalysis = await analyzeWithOpenAI(imageUrl, visionModel);
          break;
        default:
          throw new Error('Invalid analysis provider');
      }
    } catch (analysisError) {
      console.error('Analysis failed:', analysisError);
      throw new Error(`Analysis failed: ${analysisError.message}`);
    }

    console.log('Analysis completed successfully:', {
      hasStyleTags: !!styleAnalysis.style_tags,
      hasEmbedding: !!styleAnalysis.embedding,
      hasMetadata: !!styleAnalysis.metadata
    });

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