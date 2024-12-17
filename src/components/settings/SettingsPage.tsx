import { APIKeySettings } from "./APIKeySettings";
import { PreferencesSettings } from "./PreferencesSettings";

export const SettingsPage = () => {
  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      <div className="space-y-6">
        <APIKeySettings />
        <PreferencesSettings />
      </div>
    </div>
  );
};