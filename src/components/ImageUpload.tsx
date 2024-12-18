import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UploadProgress } from "./upload/UploadProgress";
import { UploadPreview } from "./upload/UploadPreview";
import { UploadDropzone } from "./upload/UploadDropzone";
import { ErrorDialog } from "./upload/ErrorDialog";
import { AnalysisProviderSelect } from "./upload/AnalysisProviderSelect";
import { GuestAuthPrompt } from "./upload/GuestAuthPrompt";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const ImageUpload = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { userData } = useAuth();

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `upload_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      setUploadProgress(10);

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

      setPreview(URL.createObjectURL(file));
      setUploadProgress(50);
      
      // Use appropriate model based on subscription
      const selectedModel = userData?.subscription_tier === 'premium' ? 'gpt-4o' : 'gpt-4o-mini';
      const provider = 'openai';
      
      console.log('Analyzing image with model:', selectedModel, 'provider:', provider);
      
      // Analyze image
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-style', {
        body: { 
          imageUrl: publicUrl,
          visionModel: selectedModel,
          provider: provider
        }
      });

      if (analysisError) {
        console.error('Analysis error:', analysisError);
        throw new Error('Failed to analyze image: ' + analysisError.message);
      }

      console.log('Analysis result:', analysisData);
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
      setUploadCount(prev => prev + 1);
      
      if (!sessionData.session?.user && uploadCount >= 2) {
        setShowAuthPrompt(true);
        toast({
          title: "Trial Limit Reached",
          description: "Create an account to continue using StyleMatch AI and save your preferences!",
        });
      } else {
        toast({
          title: "Upload successful!",
          description: "Your image has been analyzed. We'll show you matching items.",
        });
        navigate("/matches");
      }

    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload image");
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [navigate, toast, uploadCount, userData?.subscription_tier]);

  return (
    <Card className="w-full max-w-md mx-auto p-4 sm:p-6 shadow-lg">
      <div className="space-y-4 sm:space-y-6">
        <AnalysisProviderSelect />

        <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 text-center hover:border-primary transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Upload image"
            disabled={isLoading}
          />
          {isLoading ? (
            <UploadProgress progress={uploadProgress} />
          ) : preview ? (
            <UploadPreview 
              preview={preview} 
              onRemove={() => setPreview(null)}
              isLoading={isLoading}
            />
          ) : (
            <UploadDropzone />
          )}
        </div>

        <ErrorDialog 
          error={error}
          onClose={() => setError(null)}
        />

        <GuestAuthPrompt 
          open={showAuthPrompt}
          onOpenChange={setShowAuthPrompt}
        />

        {preview && !isLoading && (
          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => setPreview(null)}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Clear
            </Button>
            <Button
              onClick={() => handleFileChange}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Find Matches
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};