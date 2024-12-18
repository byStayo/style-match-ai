import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Key, Save, Sparkles, Zap, Clock, Star } from "lucide-react";

interface ModelOption {
  id: string;
  name: string;
  description: string;
  type: 'fast' | 'balanced' | 'powerful';
  icon: JSX.Element;
}

const MODEL_OPTIONS: ModelOption[] = [
  {
    id: "gpt-4o-mini",
    name: "GPT-4 Mini",
    description: "Fast and efficient for basic style analysis",
    type: 'fast',
    icon: <Zap className="w-4 h-4 text-yellow-500" />
  },
  {
    id: "gpt-4o",
    name: "GPT-4 Optimized",
    description: "Best quality for detailed style analysis",
    type: 'powerful',
    icon: <Star className="w-4 h-4 text-purple-500" />
  },
  {
    id: "gpt-4o-turbo",
    name: "GPT-4 Turbo",
    description: "Balanced performance and quality",
    type: 'balanced',
    icon: <Clock className="w-4 h-4 text-blue-500" />
  },
  {
    id: "gpt-4o-vision",
    name: "GPT-4 Vision",
    description: "Specialized in visual style analysis",
    type: 'powerful',
    icon: <Brain className="w-4 h-4 text-green-500" />
  }
];

export const LLMSettings = () => {
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
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
          openai_api_key: apiKey,
          preferences: {
            ...userData?.preferences,
            llm_model: selectedModel
          }
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Your LLM settings have been updated successfully.",
      });
      setApiKey("");
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
          <Brain className="w-5 h-5" />
          Language Model Settings
        </CardTitle>
        <CardDescription>
          Configure your AI model preferences and API keys for style analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <label className="text-sm font-medium">Model Selection</label>
          <Select
            value={selectedModel}
            onValueChange={setSelectedModel}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select LLM model" />
            </SelectTrigger>
            <SelectContent>
              {MODEL_OPTIONS.map((model) => (
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
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Choose the model that best fits your style analysis needs
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Key className="w-4 h-4" />
            OpenAI API Key
          </label>
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleSaveSettings} 
              disabled={isSaving}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Your API key is stored securely and used for style analysis
          </p>
        </div>
      </CardContent>
    </Card>
  );
};