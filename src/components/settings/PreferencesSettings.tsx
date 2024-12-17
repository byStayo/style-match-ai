import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Settings2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserPreferences } from "@/types/settings";

export const PreferencesSettings = () => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    minMatchScore: 0.7,
    autoScrapeNewProducts: true,
    emailNotifications: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSavePreferences = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save your preferences.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({ preferences })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Preferences Saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
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
          <Settings2 className="w-5 h-5" />
          Preferences
        </CardTitle>
        <CardDescription>
          Customize your style matching experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Minimum Match Score ({preferences.minMatchScore * 100}%)
            </label>
            <Slider
              value={[preferences.minMatchScore * 100]}
              onValueChange={(value) => setPreferences(prev => ({
                ...prev,
                minMatchScore: value[0] / 100
              }))}
              min={50}
              max={95}
              step={5}
            />
            <p className="text-sm text-muted-foreground">
              Only show matches above this similarity threshold
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">
                Auto-scrape New Products
              </label>
              <p className="text-sm text-muted-foreground">
                Automatically check stores for new products
              </p>
            </div>
            <Switch
              checked={preferences.autoScrapeNewProducts}
              onCheckedChange={(checked) => setPreferences(prev => ({
                ...prev,
                autoScrapeNewProducts: checked
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">
                Email Notifications
              </label>
              <p className="text-sm text-muted-foreground">
                Receive updates about new style matches
              </p>
            </div>
            <Switch
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) => setPreferences(prev => ({
                ...prev,
                emailNotifications: checked
              }))}
            />
          </div>
        </div>

        <Button 
          onClick={handleSavePreferences} 
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