import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import type { UserData } from "@/types/auth";

interface UploadProgress {
  stage: 'upload' | 'analysis' | 'matching';
  percent: number;
  message: string;
}

export const useUploadHandler = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { userData } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    setError(null);
    setIsLoading(true);
    setUploadProgress(0);

    try {
      if (!userData?.id) {
        throw new Error("User not authenticated");
      }

      // Validate file
      if (!file.type.startsWith("image/")) {
        throw new Error("Please upload an image file");
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Image size should be less than 5MB");
      }

      setUploadProgress(20);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      // Upload to Supabase Storage with progress tracking
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('style-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setUploadProgress(40);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('style-uploads')
        .getPublicUrl(filePath);

      setUploadProgress(60);

      // Call analyze-style function with enhanced options
      const { data: analysisData, error: analysisError } = await supabase.functions
        .invoke('analyze-style', {
          body: { 
            imageUrl: publicUrl,
            visionModel: 'gpt-4-vision-preview',
            provider: 'openai',
            options: {
              detailedAnalysis: true,
              confidenceScoring: true,
              styleTagging: true,
              colorAnalysis: true,
              attributeWeighting: {
                style: 0.6,
                color: 0.2,
                occasion: 0.2
              }
            }
          }
        });

      if (analysisError) throw analysisError;

      setUploadProgress(80);

      // Store upload and analysis results with enhanced metadata
      const { error: styleUploadError } = await supabase
        .from('style_uploads')
        .insert({
          user_id: userData.id,
          image_url: publicUrl,
          upload_type: 'clothing',
          embedding: analysisData.analysis.embedding,
          metadata: {
            style_tags: analysisData.analysis.style_tags,
            analysis_provider: 'openai',
            vision_model: 'gpt-4-vision-preview',
            confidence_scores: analysisData.analysis.confidence_scores,
            style_attributes: analysisData.analysis.style_attributes,
            color_analysis: analysisData.analysis.color_analysis,
            occasion_matches: analysisData.analysis.occasion_matches,
            ...analysisData.analysis.metadata
          }
        });

      if (styleUploadError) throw styleUploadError;

      setUploadProgress(90);

      // Trigger immediate product matching with enhanced parameters
      await supabase.functions.invoke('match-products', {
        body: { 
          styleUploadId: analysisData.id,
          minSimilarity: 0.7,
          limit: 20,
          options: {
            weightedScoring: true,
            styleTagMatching: true,
            confidenceThreshold: 0.8,
            priceRangeMatching: true,
            colorMatching: true,
            occasionMatching: true,
            weights: {
              style: 0.5,
              color: 0.2,
              occasion: 0.2,
              price: 0.1
            }
          }
        }
      });

      setUploadProgress(100);

      toast({
        title: "Upload successful",
        description: "Your style has been analyzed and matches are being generated.",
      });

      // Redirect to matches page
      window.location.href = '/matches';

    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload image");
      
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Failed to upload image",
        variant: "destructive",
      });
      
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