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
  const [hasUsedGuestTrial, setHasUsedGuestTrial] = useState(false);
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

      // Create a unique file name for guest uploads
      const fileExt = file.name.split('.').pop();
      const fileName = `guest_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `guest/${fileName}`;

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
      
      // Check if user is authenticated
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) {
        if (!hasUsedGuestTrial) {
          setShowAuthPrompt(true);
          setHasUsedGuestTrial(true);
          toast({
            title: "Try StyleMatch AI",
            description: "Create an account to save your preferences and get unlimited recommendations!",
          });
        } else {
          toast({
            title: "Account Required",
            description: "Please create an account to continue using StyleMatch AI.",
            variant: "destructive",
          });
          setPreview(null);
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

  const handleContinueAsGuest = () => {
    setShowAuthPrompt(false);
    toast({
      title: "One-Time Trial",
      description: "Create an account to save your preferences and get unlimited recommendations!",
    });
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
            disabled={isLoading || (hasUsedGuestTrial && !supabase.auth.getUser())}
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
          onContinueAsGuest={handleContinueAsGuest}
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