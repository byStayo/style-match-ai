import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2';
import { StyleAnalysis, STYLE_CATEGORIES } from '../_shared/types.ts';

export async function analyzeWithHuggingFace(imageUrl: string): Promise<StyleAnalysis> {
  const hfToken = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
  if (!hfToken) {
    throw new Error('HuggingFace API token not configured');
  }

  const hf = new HfInference(hfToken);
  console.log('Using HuggingFace for analysis');

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

  return {
    style_tags: classification.labels,
    embedding: embeddingResponse,
    confidence_scores: classification.scores,
    metadata: {
      provider: 'huggingface',
      model: 'clip-vit-base-patch32',
      classification_model: 'mobilevitv2-1.0'
    }
  };
}