import { Upload } from "lucide-react";

export const UploadDropzone = () => {
  return (
    <div className="p-8 border-2 border-dashed border-accent/30 rounded-xl hover:border-accent/50 transition-all duration-300">
      <div className="space-y-6">
        <div className="mx-auto w-16 h-16 text-accent animate-bounce">
          <Upload className="w-full h-full" />
        </div>
        <div className="space-y-3">
          <p className="text-xl font-semibold text-foreground">
            Upload an image
          </p>
          <p className="text-muted-foreground">
            Drag and drop or click to select
          </p>
          <p className="text-xs text-muted-foreground/70">
            Maximum file size: 5MB
          </p>
        </div>
      </div>
    </div>
  );
};