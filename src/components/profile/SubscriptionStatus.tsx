import { Button } from "@/components/ui/button";
import { UserData } from "@/hooks/useAuth";
import { SubscribeButton } from "@/components/SubscribeButton";

interface SubscriptionStatusProps {
  userData: UserData | null;
}

export const SubscriptionStatus = ({ userData }: SubscriptionStatusProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Subscription Status</h3>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Current Plan: {userData?.subscription_tier === 'premium' ? 'Premium' : 'Free'}
        </p>
        {userData?.subscription_tier === 'premium' ? (
          <p className="text-sm text-green-600">
            ✓ Unlimited uploads
            <br />
            ✓ Advanced style analysis
            <br />
            ✓ Priority support
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Free Plan Limits:
              <br />
              - 5 uploads per month
              <br />
              - Basic style analysis
            </p>
            <SubscribeButton />
          </div>
        )}
      </div>
    </div>
  );
};