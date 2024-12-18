import { LLMSettings } from "./settings/LLMSettings";
import { AuthSection } from "./settings/AuthSection";
import { useAuth } from "@/hooks/useAuth";
import { SubscriptionStatus } from "./profile/SubscriptionStatus";
import { Settings2 } from "lucide-react";

export const ProfileSection = () => {
  const { user, userData } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Settings2 className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Settings
          </h1>
        </div>
        
        <div className="grid gap-8 md:grid-cols-[1fr_300px]">
          <div className="space-y-8">
            <AuthSection />
            <LLMSettings user={user} />
          </div>
          
          <div className="space-y-8">
            <SubscriptionStatus userData={userData} />
          </div>
        </div>
      </div>
    </div>
  );
};