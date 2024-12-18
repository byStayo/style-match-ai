import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { FileOptions } from "@supabase/storage-js";

interface CustomFileOptions extends FileOptions {
  onUploadProgress?: (progress: { loaded: number; total: number }) => void;
}

export const useUploadHandler = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const { userData } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    if (!userData?.id) {
      throw new Error("User not authenticated");
    }

    setIsLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Upload image to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${userData.id}/${fileName}`;

      const uploadOptions: CustomFileOptions = {
        upsert: true,
        onUploadProgress: (progress) => {
          setUploadProgress((progress.loaded / progress.total) * 50); // First 50%
        },
      };

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('style-uploads')
        .upload(filePath, file, uploadOptions);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('style-uploads')
        .getPublicUrl(filePath);

      setUploadProgress(60); // Image uploaded

      // Analyze image using Edge Function
      const { data: analysisData, error: analysisError } = await supabase.functions
        .invoke('analyze-style', {
          body: { 
            imageUrl: publicUrl,
            visionModel: 'gpt-4o-mini',
            provider: 'openai',
            options: {
              detailedAnalysis: true,
              generateEmbedding: true
            }
          }
        });

      if (analysisError) throw analysisError;

      setUploadProgress(80); // Analysis complete

      // Store upload record with analysis results
      const { error: dbError } = await supabase
        .from('style_uploads')
        .insert({
          user_id: userData.id,
          image_url: publicUrl,
          upload_type: 'manual',
          image_type: file.type,
          embedding: analysisData.embedding,
          metadata: {
            style_tags: analysisData.analysis.style_tags,
            analysis_provider: 'openai',
            vision_model: 'gpt-4o-mini',
            confidence_scores: analysisData.analysis.confidence_scores,
            style_attributes: analysisData.analysis.style_attributes,
            color_analysis: analysisData.analysis.color_analysis,
          }
        });

      if (dbError) throw dbError;

      setUploadProgress(100); // Upload complete

      return analysisData;

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err : new Error('Failed to upload image'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleFileUpload,
    isLoading,
    uploadProgress,
    error
  };
};