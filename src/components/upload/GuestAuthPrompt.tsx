import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AuthButtons } from "../AuthButtons";

interface GuestAuthPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GuestAuthPrompt = ({ open, onOpenChange }: GuestAuthPromptProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Your Style Preferences</DialogTitle>
          <DialogDescription>
            Create an account to save your style preferences, get personalized recommendations, and access your style history.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <AuthButtons />
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Continue as Guest
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Note: Guest uploads are temporary and will be deleted after 24 hours.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};