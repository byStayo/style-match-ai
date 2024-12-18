import { AuthButtons } from "@/components/AuthButtons";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const AuthSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Signed out successfully",
      description: "You have been signed out of your account.",
    });
  };

  return (
    <div className="bg-background rounded-lg p-8 border mb-6">
      <h2 className="text-2xl font-semibold mb-4">Authentication</h2>
      {user ? (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Signed in as: <span className="font-medium">{user.email}</span>
          </p>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Sign in or create an account to save your preferences and access all features.
          </p>
          <AuthButtons />
        </div>
      )}
    </div>
  );
};