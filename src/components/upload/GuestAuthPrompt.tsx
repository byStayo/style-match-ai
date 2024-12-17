import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GuestAuthPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GuestAuthPrompt = ({ open, onOpenChange }: GuestAuthPromptProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We've sent you a magic link to sign in and save your preferences.",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Auth error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send magic link",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Continue with StyleMatch AI</DialogTitle>
          <DialogDescription>
            Create an account to save your preferences and continue discovering your perfect style matches.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSignUp} className="space-y-4">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Try More Later
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Sending..." : "Continue"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};