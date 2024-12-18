import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUploadHandler } from "@/hooks/useUploadHandler";
import { UploadProgress } from "./UploadProgress";
import { UploadPreview } from "./UploadPreview";
import { UploadDropzone } from "./UploadDropzone";
import { ErrorDialog } from "./ErrorDialog";
import { AnalysisProviderSelect } from "./AnalysisProviderSelect";
import { GuestAuthPrompt } from "./GuestAuthPrompt";
import { Card } from "../ui/card";

export const ImageUploader = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { handleFileUpload, isLoading, uploadProgress, error } = useUploadHandler();

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      await handleFileUpload(file);
      navigate("/matches");
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    }
  }, [handleFileUpload, navigate, toast]);

  return (
    <Card className="w-full max-w-xl mx-auto mt-8 overflow-hidden bg-gradient-to-br from-background to-accent/10 border-2 hover:border-accent/20 transition-all duration-300">
      <div className="p-8 space-y-8">
        <AnalysisProviderSelect />

        <div 
          className="relative border-2 border-dashed border-accent/30 rounded-xl p-8 text-center hover:border-accent/50 transition-all duration-300 cursor-pointer bg-background/50 backdrop-blur-sm"
          role="button"
          tabIndex={0}
        >
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
          onClose={() => null}
        />

        <GuestAuthPrompt 
          open={showAuthPrompt}
          onOpenChange={setShowAuthPrompt}
        />
      </div>
    </Card>
  );
};