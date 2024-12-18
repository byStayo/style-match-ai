import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Camera, ScanFace, Image, Save } from "lucide-react";

interface VisionModel {
  id: string;
  name: string;
  description: string;
  provider: 'openai' | 'anthropic' | 'google' | 'huggingface';
  icon: JSX.Element;
  requiresKey?: boolean;
}

const VISION_MODELS: VisionModel[] = [
  {
    id: "gpt-4-vision",
    name: "GPT-4 Vision",
    description: "Best quality for detailed style analysis",
    provider: 'openai',
    icon: <Eye className="w-4 h-4 text-blue-500" />,
    requiresKey: true
  },
  {
    id: "claude-3-vision",
    name: "Claude 3 Vision",
    description: "High quality vision analysis with detailed descriptions",
    provider: 'anthropic',
    icon: <Camera className="w-4 h-4 text-purple-500" />,
    requiresKey: true
  },
  {
    id: "gemini-vision",
    name: "Gemini Vision Pro",
    description: "Google's advanced vision model for style analysis",
    provider: 'google',
    icon: <ScanFace className="w-4 h-4 text-green-500" />,
    requiresKey: true
  },
  {
    id: "hf-microsoft-git",
    name: "Microsoft GIT",
    description: "Efficient open-source vision model",
    provider: 'huggingface',
    icon: <Image className="w-4 h-4 text-yellow-500" />
  }
];

export const LLMSettings = () => {
  const [selectedModel, setSelectedModel] = useState("gpt-4-vision");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user, userData } = useAuth();

  const handleSaveSettings = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save your settings.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({ 
          preferences: {
            ...userData?.preferences,
            vision_model: selectedModel
          }
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Your vision model preferences have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Vision Model Settings
        </CardTitle>
        <CardDescription>
          Configure your preferred AI vision model for style analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <label className="text-sm font-medium">Vision Model Selection</label>
          <Select
            value={selectedModel}
            onValueChange={setSelectedModel}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select vision model" />
            </SelectTrigger>
            <SelectContent>
              {VISION_MODELS.map((model) => (
                <SelectItem 
                  key={model.id} 
                  value={model.id}
                  className="flex items-center gap-2"
                >
                  <div className="flex items-center gap-2">
                    {model.icon}
                    <div>
                      <p className="font-medium">{model.name}</p>
                      <p className="text-xs text-muted-foreground">{model.description}</p>
                      <p className="text-xs text-muted-foreground">Provider: {model.provider}</p>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Choose the vision model that best fits your style analysis needs
          </p>
        </div>

        <Button 
          onClick={handleSaveSettings} 
          disabled={isSaving}
          className="w-full gap-2"
        >
          <Save className="w-4 h-4" />
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  );
};