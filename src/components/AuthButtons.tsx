import { Button } from "@/components/ui/button";
import { Apple, LogIn } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Provider } from "@supabase/supabase-js";

export const AuthButtons = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSignIn = async (provider: Provider) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Welcome!",
        description: `Successfully initiated sign in with ${provider}`,
      });
    } catch (error) {
      console.error("Auth error:", error);
      toast({
        title: "Authentication Error",
        description: "Failed to sign in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestAccess = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInAnonymously();

      if (error) throw error;

      toast({
        title: "Welcome!",
        description: "You're continuing as a guest. Some features may be limited.",
      });
    } catch (error) {
      console.error("Guest auth error:", error);
      toast({
        title: "Error",
        description: "Failed to continue as guest. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
      <Button
        variant="outline"
        onClick={() => handleSignIn("apple")}
        disabled={isLoading}
        className="w-full"
      >
        <Apple className="mr-2 h-4 w-4" />
        Sign in with Apple
      </Button>
      <Button
        variant="outline"
        onClick={() => handleSignIn("google")}
        disabled={isLoading}
        className="w-full"
      >
        <svg
          className="mr-2 h-4 w-4"
          aria-hidden="true"
          focusable="false"
          data-prefix="fab"
          data-icon="google"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 488 512"
        >
          <path
            fill="currentColor"
            d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
          ></path>
        </svg>
        Sign in with Google
      </Button>
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>
      <Button
        variant="secondary"
        onClick={handleGuestAccess}
        disabled={isLoading}
        className="w-full"
      >
        <LogIn className="mr-2 h-4 w-4" />
        Continue as Guest
      </Button>
    </div>
  );
};