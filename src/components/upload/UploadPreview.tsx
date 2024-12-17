import { Button } from "@/components/ui/button";

interface UploadPreviewProps {
  preview: string;
  onRemove: () => void;
  isLoading: boolean;
}

export const UploadPreview = ({ preview, onRemove, isLoading }: UploadPreviewProps) => {
  return (
    <>
      <div className="relative w-full aspect-square">
        <img
          src={preview}
          alt="Preview"
          className="w-full h-full object-cover rounded-lg"
        />
      </div>
      <Button
        onClick={onRemove}
        variant="outline"
        className="mt-4 w-full"
        disabled={isLoading}
      >
        Remove Image
      </Button>
    </>
  );
};