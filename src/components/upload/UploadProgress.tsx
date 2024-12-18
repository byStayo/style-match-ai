import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";

interface UploadProgressProps {
  progress: number;
}

export const UploadProgress = ({ progress }: UploadProgressProps) => {
  return (
    <Card className="p-8 bg-gradient-to-br from-background to-accent/5">
      <div className="space-y-6">
        <div className="mx-auto w-16 h-16 text-accent">
          <Loader2 className="w-full h-full animate-spin" />
        </div>
        <Progress value={progress} className="w-full h-2 bg-accent/20" />
        <p className="text-sm text-muted-foreground animate-pulse">
          {progress < 100 
            ? "Uploading and analyzing your image..." 
            : "Finalizing analysis..."}
        </p>
      </div>
    </Card>
  );
};