import { APISettings } from "./profile/APISettings";
import { SubscriptionStatus } from "./profile/SubscriptionStatus";
import { LLMSettings } from "./settings/LLMSettings";
import { useAuth } from "@/hooks/useAuth";

export const ProfileSection = () => {
  const { user, userData } = useAuth();

  return (
    <div className="space-y-6">
      <LLMSettings />
      <SubscriptionStatus userData={userData} />
      <APISettings user={user} />
    </div>
  );
};