import { Upload } from "lucide-react";

export const UploadDropzone = () => {
  return (
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
  );
};