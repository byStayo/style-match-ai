import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Provider } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Google } from "lucide-react";

export const AuthButtons = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const { toast } = useToast();

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

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        toast({
          title: "Sign In Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Check your email",
        description: "We've sent you a magic link to sign in.",
      });
      setEmail("");
    } catch (error) {
      console.error("Email auth error:", error);
      toast({
        title: "Authentication Error",
        description: "Failed to send magic link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your email to receive a magic link or continue with Google
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              className="bg-background"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isLoading}
          >
            <Mail className="mr-2 h-4 w-4" />
            Send Magic Link
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => handleSignIn("google")}
          disabled={isLoading}
          className="w-full"
        >
          <Google className="mr-2 h-4 w-4" />
          Sign in with Google
        </Button>
      </CardContent>
    </Card>
  );
};