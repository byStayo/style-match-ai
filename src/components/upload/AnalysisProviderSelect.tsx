import { Label } from "@/components/ui/label";

export const AnalysisProviderSelect = () => {
  return (
    <div className="mb-4">
      <Label>Analysis Provider</Label>
      <p className="text-sm text-muted-foreground mt-1">
        Using your selected vision model from settings for style analysis
      </p>
    </div>
  );
};