import { AuthButtons } from "@/components/AuthButtons";
import { APIKeySettings } from "./APIKeySettings";
import { PreferencesSettings } from "./PreferencesSettings";
import { LLMSettings } from "./LLMSettings";
import { useAuth } from "@/hooks/useAuth";

export const SettingsPage = () => {
  const { user } = useAuth();

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-8">
      {!user && (
        <section className="bg-muted/50 rounded-lg p-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Sign in to Access Settings
            </h2>
            <p className="text-muted-foreground mb-8">
              Create an account or sign in to customize your experience and save your preferences.
            </p>
            <AuthButtons />
          </div>
        </section>
      )}

      {user && (
        <>
          <h1 className="text-3xl font-bold">Settings</h1>
          <div className="grid gap-6">
            <LLMSettings user={user} />
            <APIKeySettings />
            <PreferencesSettings />
          </div>
        </>
      )}
    </div>
  );
};