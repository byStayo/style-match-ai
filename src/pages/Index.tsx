import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ImageUpload } from "@/components/ImageUpload";
import { StyleGrid } from "@/components/StyleGrid";
import { AuthButtons } from "@/components/AuthButtons";
import { ProfileSection } from "@/components/ProfileSection";
import { StoreSelector } from "@/components/StoreSelector";
import { SocialMediaConnect } from "@/components/SocialMediaConnect";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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
      <header className="border-b">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-primary">StyleMatch AI</h1>
            {user && (
              <button
                onClick={() => navigate("/profile")}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                View Profile
              </button>
            )}
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {!user && !loading && (
            <section className="bg-muted/50 rounded-lg p-8">
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Get Started with StyleMatch AI
                </h2>
                <p className="text-muted-foreground mb-8">
                  Sign in to unlock personalized style recommendations and more.
                </p>
                <AuthButtons />
              </div>
            </section>
          )}

          {user && (
            <>
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

              <section className="bg-background rounded-lg p-8 border">
                <div className="max-w-2xl mx-auto text-center">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">
                    Connect Your Social Media
                  </h2>
                  <p className="text-muted-foreground mb-8">
                    Connect your social accounts or analyze public profiles to get personalized recommendations.
                  </p>
                  <SocialMediaConnect />
                </div>
              </section>

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
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;