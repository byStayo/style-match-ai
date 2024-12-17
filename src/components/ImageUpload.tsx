import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UploadProgress } from "./upload/UploadProgress";
import { UploadPreview } from "./upload/UploadPreview";
import { UploadDropzone } from "./upload/UploadDropzone";
import { ErrorDialog } from "./upload/ErrorDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AuthButtons } from "./AuthButtons";

export const ImageUpload = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [analysisProvider, setAnalysisProvider] = useState<'huggingface' | 'openai'>('huggingface');
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
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

      // Show upload starting
      setUploadProgress(10);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('style-uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setUploadProgress(90);

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('style-uploads')
        .getPublicUrl(filePath);

      setPreview(URL.createObjectURL(file));
      setUploadProgress(100);
      
      // Check if user is authenticated
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) {
        // Show auth prompt after successful upload for guest users
        setShowAuthPrompt(true);
        toast({
          title: "Upload successful",
          description: "Create an account to save your style preferences and get personalized recommendations!",
        });
      } else {
        // For authenticated users, save to style_uploads table
        const { error: dbError } = await supabase
          .from('style_uploads')
          .insert({
            user_id: sessionData.session.user.id,
            image_url: publicUrl,
            upload_type: 'user_upload',
            image_type: 'clothing',
            metadata: {
              original_filename: file.name,
              content_type: file.type,
              size: file.size
            }
          });

        if (dbError) throw dbError;

        toast({
          title: "Upload successful",
          description: "Your image has been uploaded and will be analyzed for style matching.",
        });

        // Trigger style analysis with selected provider
        await analyzeStyle(publicUrl);
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

  const analyzeStyle = async (imageUrl: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        // For guest users, show limited analysis results
        toast({
          title: "Limited Analysis",
          description: "Create an account to get full style analysis and personalized recommendations!",
        });
        return;
      }

      const response = await supabase.functions.invoke('analyze-style', {
        body: { 
          imageUrl,
          analysisProvider 
        },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (response.error) throw new Error(response.error.message);

      toast({
        title: "Analysis complete",
        description: "We'll show you matching items based on this style.",
      });
    } catch (error) {
      console.error('Style analysis error:', error);
      toast({
        title: "Analysis failed",
        description: "We couldn't analyze your style. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 animate-fade-in">
      <div className="mb-4">
        <Label htmlFor="analysis-provider">Analysis Provider</Label>
        <Select
          value={analysisProvider}
          onValueChange={(value: 'huggingface' | 'openai') => setAnalysisProvider(value)}
        >
          <SelectTrigger id="analysis-provider" className="w-full">
            <SelectValue placeholder="Select analysis provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="huggingface">Hugging Face (Default)</SelectItem>
            <SelectItem value="openai">OpenAI Vision</SelectItem>
          </SelectContent>
        </Select>
      </div>

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

      <Dialog open={showAuthPrompt} onOpenChange={setShowAuthPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Your Style Preferences</DialogTitle>
            <DialogDescription>
              Create an account to save your style preferences, get personalized recommendations, and access your style history.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <AuthButtons />
            <Button 
              variant="ghost" 
              onClick={() => setShowAuthPrompt(false)}
              className="w-full"
            >
              Continue as Guest
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Note: Guest uploads are temporary and will be deleted after 24 hours.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};