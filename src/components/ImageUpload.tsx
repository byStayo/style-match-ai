import { useState } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export const ImageUpload = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
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
        />
        {preview ? (
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
            </div>
          </div>
        )}
      </div>
      {preview && (
        <Button
          onClick={() => setPreview(null)}
          variant="outline"
          className="mt-4 w-full"
        >
          Remove Image
        </Button>
      )}
    </div>
  );
};