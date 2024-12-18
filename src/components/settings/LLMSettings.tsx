import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Key, Save } from "lucide-react";

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          LLM Settings
        </CardTitle>
        <CardDescription>
          Configure your Language Model preferences and API keys
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Model Selection</label>
          <Select
            value={selectedModel}
            onValueChange={setSelectedModel}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select LLM model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4o">GPT-4 Optimized (Best Quality)</SelectItem>
              <SelectItem value="gpt-4o-mini">GPT-4 Mini (Faster)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Choose the model that best fits your needs
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="openai-key" className="text-sm font-medium flex items-center gap-2">
            <Key className="w-4 h-4" />
            OpenAI API Key
          </label>
          <div className="flex gap-2">
            <Input
              id="openai-key"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <Button 
              onClick={handleSaveSettings} 
              disabled={!apiKey || isSaving}
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