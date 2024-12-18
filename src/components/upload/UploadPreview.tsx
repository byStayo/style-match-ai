import { Button } from "@/components/ui/button";

interface UploadPreviewProps {
  preview: string;
  onRemove: () => void;
  isLoading: boolean;
}

export const UploadPreview = ({ preview, onRemove, isLoading }: UploadPreviewProps) => {
  return (
    <div className="space-y-6">
      <div className="relative w-full max-w-sm mx-auto aspect-square rounded-lg overflow-hidden shadow-xl">
        <img
          src={preview}
          alt="Preview"
          className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
        />
      </div>
      <Button
        onClick={onRemove}
        variant="outline"
        className="w-full max-w-sm mx-auto bg-background/80 backdrop-blur-sm hover:bg-background"
        disabled={isLoading}
      >
        Remove Image
      </Button>
    </div>
  );
};