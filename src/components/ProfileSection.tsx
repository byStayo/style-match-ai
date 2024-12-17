import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/ImageUpload";
import { SocialMediaConnect } from "@/components/SocialMediaConnect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Image, Heart, Palette, Link, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const ProfileSection = () => {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const colors = [
    "red", "blue", "green", "yellow", "purple", "pink", "orange", "brown", "black", "white"
  ];

  const handleColorToggle = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
    
    toast({
      title: "Preferences Updated",
      description: `${color} has been ${selectedColors.includes(color) ? "removed from" : "added to"} your preferences.`
    });
  };

  const handleSaveApiKey = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ openai_api_key: apiKey })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "API Key Saved",
        description: "Your OpenAI API key has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving API key:', error);
      toast({
        title: "Error",
        description: "Failed to save API key. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto mt-8">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please sign in to view your profile.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <div className="flex items-center gap-4">
          <User className="w-8 h-8 text-primary" />
          <CardTitle>Profile</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="library" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Library
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Favorites
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="accounts" className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              Accounts
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="mt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Style Library</h3>
              <ImageUpload />
              {userData?.uploads && userData.uploads.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {userData.uploads.map((url, index) => (
                    <img 
                      key={index}
                      src={url}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No images uploaded yet. Start building your style library!
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="favorites" className="mt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Favorites</h3>
              {userData?.favorites && userData.favorites.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {userData.favorites.map((item, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <img 
                          src={item}
                          alt={`Favorite ${index + 1}`}
                          className="w-full h-40 object-cover rounded-lg mb-2"
                        />
                        <Button variant="outline" size="sm" className="w-full">
                          View Item
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No favorites yet. Heart items to save them here!
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="mt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Style Preferences</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Favorite Colors</h4>
                  <div className="flex flex-wrap gap-2">
                    {colors.map(color => (
                      <Button
                        key={color}
                        variant={selectedColors.includes(color) ? "default" : "outline"}
                        onClick={() => handleColorToggle(color)}
                        className="capitalize"
                      >
                        {color}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="accounts" className="mt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Connected Accounts</h3>
              <SocialMediaConnect />
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">API Settings</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="openai-api-key">OpenAI API Key</Label>
                    <Input
                      id="openai-api-key"
                      type="password"
                      placeholder="sk-..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Enter your OpenAI API key to use unlimited image analysis. You can get your API key from the{" "}
                      <a 
                        href="https://platform.openai.com/api-keys" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        OpenAI dashboard
                      </a>
                      .
                    </p>
                  </div>
                  <Button 
                    onClick={handleSaveApiKey} 
                    disabled={isLoading || !apiKey}
                  >
                    {isLoading ? "Saving..." : "Save API Key"}
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Subscription Status</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Current Plan: {userData?.subscription_status === 'premium' ? 'Premium' : 'Free'}
                </p>
                {userData?.subscription_status !== 'premium' && (
                  <Button variant="default">
                    Upgrade to Premium
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};