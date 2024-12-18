import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AnalysisProviderSelectProps {
  value: 'huggingface' | 'openai';
  onChange: (value: 'huggingface' | 'openai') => void;
}

export const AnalysisProviderSelect = ({ value, onChange }: AnalysisProviderSelectProps) => {
  return (
    <div className="mb-4">
      <Label htmlFor="analysis-provider">Analysis Provider</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="analysis-provider" className="w-full">
          <SelectValue placeholder="Select analysis provider" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="openai">OpenAI Vision (Recommended)</SelectItem>
          <SelectItem value="huggingface">Hugging Face</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground mt-1">
        OpenAI Vision provides more detailed style analysis and better matching results
      </p>
    </div>
  );
};