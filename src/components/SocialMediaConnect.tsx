import { Button } from "@/components/ui/button";
import { Instagram, Facebook, Video } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

export const SocialMediaConnect = () => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleConnect = async (platform: "Instagram" | "Facebook" | "TikTok") => {
    if (!auth.currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to connect your social media accounts.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(platform);
    try {
      // Here we would normally implement OAuth 2.0 flow
      // For now, we'll simulate the connection
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        [`connectedAccounts.${platform.toLowerCase()}`]: {
          connected: true,
          lastSync: new Date().toISOString(),
        }
      });

      toast({
        title: "Success!",
        description: `Connected to ${platform} successfully.`,
      });
    } catch (error) {
      console.error(`${platform} connection error:`, error);
      toast({
        title: "Connection Failed",
        description: `Failed to connect to ${platform}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handlePublicProfile = async () => {
    const url = prompt("Enter a public profile URL:");
    if (!url) return;

    try {
      // Here we would validate and process the public profile URL
      toast({
        title: "Profile Analysis",
        description: "Analyzing style preferences from public profile...",
      });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Analysis Complete",
        description: "Style preferences have been analyzed and saved.",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze profile. Please check the URL and try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          variant="outline"
          onClick={() => handleConnect("Instagram")}
          disabled={!!isLoading}
          className="w-full"
        >
          <Instagram className="mr-2 h-4 w-4" />
          {isLoading === "Instagram" ? "Connecting..." : "Connect Instagram"}
        </Button>
        
        <Button
          variant="outline"
          onClick={() => handleConnect("Facebook")}
          disabled={!!isLoading}
          className="w-full"
        >
          <Facebook className="mr-2 h-4 w-4" />
          {isLoading === "Facebook" ? "Connecting..." : "Connect Facebook"}
        </Button>
        
        <Button
          variant="outline"
          onClick={() => handleConnect("TikTok")}
          disabled={!!isLoading}
          className="w-full"
        >
          <Video className="mr-2 h-4 w-4" />
          {isLoading === "TikTok" ? "Connecting..." : "Connect TikTok"}
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <Button
        variant="secondary"
        onClick={handlePublicProfile}
        className="w-full"
        disabled={!!isLoading}
      >
        Analyze Public Profile
      </Button>
    </div>
  );
};