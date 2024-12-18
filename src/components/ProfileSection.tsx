import { APISettings } from "./profile/APISettings";
import { SubscriptionStatus } from "./profile/SubscriptionStatus";
import { LLMSettings } from "./settings/LLMSettings";
import { AuthSection } from "./settings/AuthSection";
import { useAuth } from "@/hooks/useAuth";

export const ProfileSection = () => {
  const { user, userData } = useAuth();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      <div className="space-y-6">
        <AuthSection />
        <LLMSettings />
        <SubscriptionStatus userData={userData} />
        <APISettings user={user} />
      </div>
    </div>
  );
};