import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AuthButtons } from "../AuthButtons";

interface GuestAuthPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinueAsGuest: () => void;
}

export const GuestAuthPrompt = ({ open, onOpenChange, onContinueAsGuest }: GuestAuthPromptProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Your Style Profile</DialogTitle>
          <DialogDescription>
            Sign up now to save your style preferences and get unlimited personalized recommendations!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <AuthButtons />
          <Button 
            variant="ghost" 
            onClick={() => {
              onContinueAsGuest();
              onOpenChange(false);
            }}
            className="w-full"
          >
            Try Once Without Account
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Note: Without an account, your style preferences won't be saved for future recommendations.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};