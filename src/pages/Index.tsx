import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ImageUpload } from "@/components/ImageUpload";
import { StyleGrid } from "@/components/StyleGrid";
import { AuthButtons } from "@/components/AuthButtons";
import { ProfileSection } from "@/components/ProfileSection";
import { StoreSelector } from "@/components/StoreSelector";
import { SocialMediaConnect } from "@/components/SocialMediaConnect";
import { StoreProductFetcher } from "@/components/store/StoreProductFetcher";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Upload, Store, Heart } from "lucide-react";

const Index = () => {
  const { user, loading, userData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      toast({
        title: "Welcome back!",
        description: userData?.subscription_tier === 'premium' 
          ? "Ready to discover your premium style matches?" 
          : "Ready to discover your style matches?",
      });
    }
  }, [user, loading, userData, toast]);

  const steps = [
    {
      title: "Upload Your Style",
      description: "Upload photos of your style inspiration",
      icon: Upload,
      component: <ImageUpload />,
      showWhen: "always"
    },
    {
      title: "Choose Your Stores",
      description: "Select stores to find matching items",
      icon: Store,
      component: <StoreSelector />,
      showWhen: "authenticated"
    },
    {
      title: "Connect Social Media",
      description: "Get personalized recommendations from your social profiles",
      icon: RefreshCw,
      component: <SocialMediaConnect />,
      showWhen: "authenticated"
    },
    {
      title: "Your Style Matches",
      description: "Discover items that match your style",
      icon: Heart,
      component: <StyleGrid />,
      showWhen: "authenticated"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-primary">StyleMatch AI</h1>
            {user ? (
              <Button
                variant="ghost"
                onClick={() => navigate("/profile")}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                View Profile
              </Button>
            ) : null}
          </div>
        </div>
      </header>

Looking at the current codebase, many of these features are already implemented:
- ✓ Image upload UI with embedding completion status
- ✓ Store selection page
- ✓ Results page with products and explanations
- ✓ Social media connection UI
- ✓ Profile page with preferences
- ✓ Favorites functionality

However, we can enhance the UI and user experience. Let's polish the existing components and add some missing features:

<lov-code>
Let's update the Index page to have a clearer flow and better visual hierarchy:

<lov-write file_path="src/pages/Index.tsx">
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ImageUpload } from "@/components/ImageUpload";
import { StyleGrid } from "@/components/StyleGrid";
import { AuthButtons } from "@/components/AuthButtons";
import { ProfileSection } from "@/components/ProfileSection";
import { StoreSelector } from "@/components/StoreSelector";
import { SocialMediaConnect } from "@/components/SocialMediaConnect";
import { StoreProductFetcher } from "@/components/store/StoreProductFetcher";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Store, Heart, Settings } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      toast({
        title: "Welcome back!",
        description: "Ready to discover your style matches?",
      });
    }
  }, [user, loading, toast]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-primary">StyleMatch AI</h1>
            {user && (
              <Button
                variant="ghost"
                onClick={() => navigate("/profile")}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                View Profile
              </Button>
            )}
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {!user && !loading ? (
          <div className="space-y-8">
            <section className="text-center">
              <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                Find Your Perfect Style Match
              </h2>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Upload your style inspiration or connect your social media to discover perfectly matched items from your favorite stores.
              </p>
            </section>

            <section className="bg-muted/50 rounded-lg p-8">
              <div className="max-w-2xl mx-auto text-center">
                <h3 className="text-2xl font-semibold text-foreground mb-4">
                  Get Started
                </h3>
                <p className="text-muted-foreground mb-8">
                  Sign in to save your preferences and get personalized recommendations.
                </p>
                <AuthButtons />
              </div>
            </section>
          </div>
        ) : (
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

                <section className="bg-background rounded-lg p-8 border mt-8">
                  <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-semibold text-foreground mb-4">
                        Update Store Products
                      </h2>
                      <p className="text-muted-foreground">
                        Refresh product catalogs from your selected stores.
                      </p>
                    </div>
                    <StoreProductFetcher />
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
        )}
      </main>
    </div>
  );
};

export default Index;