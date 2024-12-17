import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/ImageUpload";
import { StyleGrid } from "@/components/StyleGrid";
import { StoreSelector } from "@/components/StoreSelector";
import { SocialMediaConnect } from "@/components/SocialMediaConnect";
import { ProfileSection } from "@/components/ProfileSection";
import { Upload, Store, Heart, Settings } from "lucide-react";

export const DashboardTabs = () => {
  return (
    <div className="space-y-8">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px] mx-auto">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="stores" className="flex items-center gap-2">
            <Store className="w-4 h-4" />
            Stores
          </TabsTrigger>
          <TabsTrigger value="matches" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Matches
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-6">
          <section className="bg-background rounded-lg p-8 border">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Upload Your Style
              </h2>
              <p className="text-muted-foreground mb-8">
                Upload a photo of your style inspiration, and we'll find matching items for you.
              </p>
              <ImageUpload />
            </div>
          </section>

          <section className="bg-background rounded-lg p-8 border mt-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Or Connect Your Social Media
              </h2>
              <p className="text-muted-foreground mb-8">
                Connect your social accounts to get personalized recommendations.
              </p>
              <SocialMediaConnect />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="stores" className="mt-6">
          <section className="bg-background rounded-lg p-8 border">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Choose Your Stores
              </h2>
              <p className="text-muted-foreground mb-8">
                Select stores to find matching items from your favorite brands.
              </p>
              <StoreSelector />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="matches" className="mt-6">
          <section>
            <div className="max-w-2xl mx-auto text-center mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Style Matches
              </h2>
              <p className="text-muted-foreground">
                Here are some items that match your style preferences.
              </p>
            </div>
            <StyleGrid />
          </section>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <ProfileSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};