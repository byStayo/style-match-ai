import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Key, Save } from "lucide-react";

export const APIKeySettings = () => {
  const [apiKey, setApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSaveKey = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save your API key.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({ openai_api_key: apiKey })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "API Key Saved",
        description: "Your OpenAI API key has been securely saved.",
      });
      setApiKey("");
    } catch (error) {
      console.error('Error saving API key:', error);
      toast({
        title: "Error",
        description: "Failed to save API key. Please try again.",
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
          <Key className="w-5 h-5" />
          API Keys
        </CardTitle>
        <CardDescription>
          Configure your API keys for enhanced functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="openai-key" className="text-sm font-medium">
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
              onClick={handleSaveKey} 
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