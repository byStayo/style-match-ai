import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/ImageUpload";
import { SocialMediaConnect } from "@/components/SocialMediaConnect";
import { Button } from "@/components/ui/button";
import { User, Image, Heart, Palette, Link } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export const ProfileSection = () => {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

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
          <TabsList className="grid w-full grid-cols-4">
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
        </Tabs>
      </CardContent>
    </Card>
  );
};