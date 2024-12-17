import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface UploadProgressProps {
  progress: number;
}

export const UploadProgress = ({ progress }: UploadProgressProps) => {
  return (
    <div className="space-y-4">
      <div className="mx-auto w-12 h-12 text-primary">
        <Loader2 className="w-full h-full animate-spin" />
      </div>
      <Progress value={progress} className="w-full" />
      <p className="text-sm text-gray-500">
        {progress < 100 
          ? "Uploading and processing your image..." 
          : "Finalizing..."}
      </p>
    </div>
  );
};