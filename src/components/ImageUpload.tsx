import { useState } from "react";
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

export const ImageUpload = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [analysisProvider, setAnalysisProvider] = useState<'huggingface' | 'openai'>('huggingface');
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsLoading(true);
    setUploadProgress(0);

    try {
      if (!file.type.startsWith("image/")) {
        throw new Error("Please upload an image file");
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Image size should be less than 5MB");
      }

      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `upload_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      setUploadProgress(10);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('style-uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setUploadProgress(50);

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('style-uploads')
        .getPublicUrl(filePath);

      setPreview(URL.createObjectURL(file));
      
      // Analyze the image
      const { error: analysisError } = await supabase.functions.invoke('analyze-style', {
        body: { 
          imageUrl: publicUrl,
          analysisProvider 
        }
      });

      if (analysisError) throw analysisError;

      setUploadProgress(100);
      setUploadCount(prev => prev + 1);
      
      // Check if user has reached the trial limit
      if (uploadCount >= 2) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session?.user) {
          setShowAuthPrompt(true);
          toast({
            title: "Trial Limit Reached",
            description: "Create an account to continue using StyleMatch AI and save your preferences!",
          });
        }
      } else {
        toast({
          title: "Upload successful!",
          description: "Your image has been analyzed and we'll show you matching items.",
        });
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
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6">
      <div className="space-y-6">
        <AnalysisProviderSelect 
          value={analysisProvider}
          onChange={(value) => setAnalysisProvider(value)}
        />

        <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
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
            >
              Clear
            </Button>
            <Button
              onClick={() => handleFileChange}
              disabled={isLoading}
            >
              Find Matches
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};