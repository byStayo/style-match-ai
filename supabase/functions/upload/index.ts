import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { Configuration, OpenAIApi } from "https://esm.sh/openai@4.28.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, userId, uploadType = 'clothing' } = await req.json();

    if (!imageUrl || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: imageUrl or userId' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Processing upload for user ${userId}`);

    // Initialize OpenAI
    const configuration = new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });
    const openai = new OpenAIApi(configuration);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get image analysis from OpenAI
    console.log('Analyzing image with OpenAI CLIP...');
    const response = await openai.createEmbedding({
      model: "gpt-4o-mini",
      input: imageUrl,
    });

    if (!response.data) {
      throw new Error('Failed to generate embedding from OpenAI');
    }

    const embedding = response.data.data[0].embedding;
    
    // Extract style metadata using vision model
    const visionResponse = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a fashion analysis AI. Analyze the image and provide detailed style attributes."
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: imageUrl,
            },
            {
              type: "text",
              text: "Analyze this clothing item and provide style attributes including colors, patterns, style tags, and occasions."
            }
          ]
        }
      ]
    });

    const styleAnalysis = JSON.parse(visionResponse.data.choices[0].message.content);

    // Store the upload record with embedding and metadata
    const { error: uploadError } = await supabase
      .from('style_uploads')
      .insert({
        user_id: userId,
        image_url: imageUrl,
        upload_type: uploadType,
        embedding,
        metadata: {
          style_tags: styleAnalysis.style_tags,
          color_analysis: styleAnalysis.colors,
          occasions: styleAnalysis.occasions,
          confidence_scores: styleAnalysis.confidence_scores,
          analysis_provider: 'openai',
          vision_model: 'gpt-4o-mini'
        }
      });

    if (uploadError) {
      throw new Error(`Failed to store upload: ${uploadError.message}`);
    }

    // Update user's upload count
    const { error: profileError } = await supabase.rpc(
      'increment_upload_count',
      { user_id: userId }
    );

    if (profileError) {
      console.error('Failed to update upload count:', profileError);
    }

    // Generate initial matches
    const { error: matchError } = await supabase.functions.invoke('match-style', {
      body: { userId, embedding }
    });

    if (matchError) {
      console.error('Failed to generate initial matches:', matchError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        metadata: styleAnalysis,
        message: 'Image uploaded and analyzed successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        success: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});