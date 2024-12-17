import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UploadProgress } from "./upload/UploadProgress";
import { UploadPreview } from "./upload/UploadPreview";
import { UploadDropzone } from "./upload/UploadDropzone";
import { ErrorDialog } from "./upload/ErrorDialog";

export const ImageUpload = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
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

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) {
        throw new Error("Please sign in to upload images");
      }

      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${sessionData.session.user.id}/${fileName}`;

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

      // Save to style_uploads table
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

      setPreview(URL.createObjectURL(file));
      setUploadProgress(100);
      
      toast({
        title: "Upload successful",
        description: "Your image has been uploaded and will be analyzed for style matching.",
      });

      // Trigger style analysis
      await analyzeStyle(publicUrl);

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
      if (!sessionData.session) throw new Error('Authentication required');

      const response = await supabase.functions.invoke('analyze-style', {
        body: { imageUrl },
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
    </div>
  );
};