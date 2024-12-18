import { APISettings } from "./profile/APISettings";
import { SubscriptionStatus } from "./profile/SubscriptionStatus";
import { LLMSettings } from "./settings/LLMSettings";

export const ProfileSection = () => {
  return (
    <div className="space-y-6">
      <LLMSettings />
      <SubscriptionStatus />
      <APISettings />
    </div>
  );
};