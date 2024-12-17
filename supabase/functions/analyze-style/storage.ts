import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { StyleAnalysis } from '../_shared/types.ts';

export async function storeAnalysis(
  imageUrl: string, 
  styleAnalysis: StyleAnalysis, 
  userId: string
): Promise<void> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  console.log('Storing analysis for user:', userId);
  
  const { error: uploadError } = await supabase
    .from('style_uploads')
    .insert({
      user_id: userId,
      image_url: imageUrl,
      upload_type: 'clothing',
      embedding: styleAnalysis.embedding,
      metadata: {
        style_tags: styleAnalysis.style_tags,
        confidence_scores: styleAnalysis.confidence_scores,
        analysis_provider: styleAnalysis.metadata.provider,
        ...styleAnalysis.metadata
      }
    });

  if (uploadError) {
    console.error('Error storing analysis:', uploadError);
    throw uploadError;
  }
}