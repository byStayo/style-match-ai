import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface UploadPreviewProps {
  preview: string;
  onRemove: () => void;
  isLoading: boolean;
}

export const UploadPreview = ({ preview, onRemove, isLoading }: UploadPreviewProps) => {
  return (
    <div className="space-y-6">
      <Card className="p-2 bg-gradient-to-br from-background to-accent/5 shadow-xl">
        <div className="relative w-full max-w-sm mx-auto aspect-square rounded-lg overflow-hidden">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
          />
        </div>
      </Card>
      <Button
        onClick={onRemove}
        variant="outline"
        className="w-full max-w-sm mx-auto bg-background/80 backdrop-blur-sm hover:bg-background/90"
        disabled={isLoading}
      >
        Remove Image
      </Button>
    </div>
  );
};