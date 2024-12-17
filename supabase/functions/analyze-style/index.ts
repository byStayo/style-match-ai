import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/types.ts';
import { analyzeWithHuggingFace } from './huggingface.ts';
import { analyzeWithOpenAI } from './openai.ts';
import { storeAnalysis } from './storage.ts';

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
      styleAnalysis = await analyzeWithHuggingFace(imageUrl);
    } else if (analysisProvider === 'openai') {
      styleAnalysis = await analyzeWithOpenAI(imageUrl);
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
      await storeAnalysis(imageUrl, styleAnalysis, user.id);
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