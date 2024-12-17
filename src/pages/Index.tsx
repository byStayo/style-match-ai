import { ImageUpload } from "@/components/ImageUpload";
import { StyleGrid } from "@/components/StyleGrid";
import { AuthButtons } from "@/components/AuthButtons";
import { SocialMediaConnect } from "@/components/SocialMediaConnect";
import { StoreSelector } from "@/components/StoreSelector";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-primary">StyleMatch AI</h1>
            <p className="text-sm text-muted-foreground">Find your perfect style match</p>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {!user && !loading && (
            <section>
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Get Started with StyleMatch AI
                </h2>
                <p className="text-muted-foreground mb-8">
                  Sign in to unlock all features or continue as a guest.
                </p>
                <AuthButtons />
              </div>
            </section>
          )}

          {user && (
            <section>
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  Connect Your Social Media
                </h2>
                <p className="text-muted-foreground mb-8">
                  Connect your accounts or analyze public profiles to get personalized style recommendations.
                </p>
                <SocialMediaConnect />
              </div>
            </section>
          )}

          <section>
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Upload Your Style
              </h2>
              <p className="text-muted-foreground mb-8">
                Upload a photo of your style inspiration, and we'll find matching items for you.
              </p>
            </div>
            <ImageUpload />
          </section>

          <section>
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Select Stores
              </h2>
              <p className="text-muted-foreground mb-8">
                Choose from our integrated stores or add your own favorite stores.
              </p>
            </div>
            <StoreSelector />
          </section>
          
          <section>
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Style Matches
              </h2>
              <p className="text-muted-foreground mb-8">
                Here are some items that match your style preferences.
              </p>
            </div>
            <StyleGrid />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Index;