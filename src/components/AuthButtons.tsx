import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Apple, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Provider } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

export const AuthButtons = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignIn = async (provider: Provider) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error("Auth error:", error);
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data) {
        toast({
          title: "Redirecting...",
          description: `Connecting to ${provider}...`,
        });
      }
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

  const handleGuestSignIn = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'guest@example.com',
        password: 'guestpassword123',
      });

      if (error) {
        toast({
          title: "Guest Access Error",
          description: "Unable to access guest account. Please try again or use another sign-in method.",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        toast({
          title: "Welcome, Guest!",
          description: "You've been signed in as a guest user.",
        });
        navigate('/');
      }
    } catch (error) {
      console.error("Guest auth error:", error);
      toast({
        title: "Authentication Error",
        description: "Failed to sign in as guest. Please try again.",
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
      <Button
        variant="secondary"
        onClick={handleGuestSignIn}
        disabled={isLoading}
        className="w-full"
      >
        <User className="mr-2 h-4 w-4" />
        Continue as Guest
      </Button>
    </div>
  );
};