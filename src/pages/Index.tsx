import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { ImageUpload } from "@/components/ImageUpload";

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
        <div className="space-y-8">
          <section className="text-center">
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Find Your Perfect Style Match
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Upload your style inspiration to discover perfectly matched items from your favorite stores.
            </p>
          </section>

          <section className="bg-muted/50 rounded-lg p-8">
            <div className="max-w-2xl mx-auto text-center">
              <ImageUpload />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Index;