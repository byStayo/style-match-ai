import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

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
      // Validate file
      if (!file.type.startsWith("image/")) {
        throw new Error("Please upload an image file");
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Image size should be less than 5MB");
      }

      setUploadProgress(10);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `upload_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('style-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setUploadProgress(30);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('style-uploads')
        .getPublicUrl(filePath);

      setUploadProgress(50);
      
      // Use appropriate model based on subscription
      const selectedModel = userData?.subscription_tier === 'premium' ? 'gpt-4o' : 'gpt-4o-mini';
      const provider = 'openai';
      
      // Analyze image
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-style', {
        body: { 
          imageUrl: publicUrl,
          visionModel: selectedModel,
          provider: provider
        }
      });

      if (analysisError) throw analysisError;

      setUploadProgress(80);

      // Store analysis results
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) {
        const { error: styleUploadError } = await supabase
          .from('style_uploads')
          .insert({
            user_id: sessionData.session.user.id,
            image_url: publicUrl,
            upload_type: 'clothing',
            embedding: analysisData.analysis.embedding,
            metadata: {
              style_tags: analysisData.analysis.style_tags,
              vision_model: selectedModel,
              provider: provider,
              ...analysisData.analysis.metadata
            }
          });

        if (styleUploadError) throw styleUploadError;

        // Trigger immediate product matching
        await supabase.functions.invoke('match-products', {
          body: { 
            styleUploadId: analysisData.id,
            minSimilarity: 0.7,
            limit: 20
          }
        });
      }

      setUploadProgress(100);
      toast({
        title: "Upload successful!",
        description: "Your image has been analyzed. We'll show you matching items.",
      });

    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload image");
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