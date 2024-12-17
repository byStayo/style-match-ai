import { Button } from "@/components/ui/button";
import { UserData } from "@/hooks/useAuth";

interface SubscriptionStatusProps {
  userData: UserData | null;
}

export const SubscriptionStatus = ({ userData }: SubscriptionStatusProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Subscription Status</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Current Plan: {userData?.subscription_status === 'premium' ? 'Premium' : 'Free'}
      </p>
      {userData?.subscription_status !== 'premium' && (
        <Button variant="default">
          Upgrade to Premium
        </Button>
      )}
    </div>
  );
};