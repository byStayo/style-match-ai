import { useState } from "react";
import { Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

export const ImageUpload = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsLoading(true);

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

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('style-uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

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
          metadata: {
            original_filename: file.name,
            content_type: file.type,
            size: file.size
          }
        });

      if (dbError) throw dbError;

      setPreview(URL.createObjectURL(file));
      toast({
        title: "Upload successful",
        description: "Your image has been uploaded and will be analyzed for style matching.",
      });

      // Trigger style analysis (this would be implemented in a separate function)
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
      const response = await fetch('/api/analyze-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl })
      });

      if (!response.ok) throw new Error('Style analysis failed');

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
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 text-primary">
              <Loader2 className="w-full h-full animate-spin" />
            </div>
            <p className="text-sm text-gray-500">Processing your image...</p>
          </div>
        ) : preview ? (
          <div className="relative w-full aspect-square">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 text-gray-400">
              <Upload className="w-full h-full" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">Upload an image</p>
              <p className="text-sm text-gray-500">
                Drag and drop or click to select
              </p>
              <p className="text-xs text-gray-400">
                Maximum file size: 5MB
              </p>
            </div>
          </div>
        )}
      </div>
      {preview && (
        <Button
          onClick={() => setPreview(null)}
          variant="outline"
          className="mt-4 w-full"
          disabled={isLoading}
        >
          Remove Image
        </Button>
      )}

      <AlertDialog open={!!error} onOpenChange={() => setError(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error</AlertDialogTitle>
            <AlertDialogDescription>{error}</AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};