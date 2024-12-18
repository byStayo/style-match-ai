import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface UploadProgressProps {
  progress: number;
}

export const UploadProgress = ({ progress }: UploadProgressProps) => {
  return (
    <div className="space-y-6">
      <div className="mx-auto w-16 h-16 text-accent">
        <Loader2 className="w-full h-full animate-spin" />
      </div>
      <Progress value={progress} className="w-full h-2 bg-accent/20" />
      <p className="text-sm text-muted-foreground animate-pulse">
        {progress < 100 
          ? "Uploading and processing your image..." 
          : "Finalizing..."}
      </p>
    </div>
  );
};