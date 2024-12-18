import { Button } from "@/components/ui/button";

interface UploadPreviewProps {
  preview: string;
  onRemove: () => void;
  isLoading: boolean;
}

export const UploadPreview = ({ preview, onRemove, isLoading }: UploadPreviewProps) => {
  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-square max-w-sm mx-auto">
        <img
          src={preview}
          alt="Preview"
          className="w-full h-full object-cover rounded-lg"
        />
      </div>
      <Button
        onClick={onRemove}
        variant="outline"
        className="w-full max-w-sm mx-auto"
        disabled={isLoading}
      >
        Remove Image
      </Button>
    </div>
  );
};