import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Instagram, Facebook, Video, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const SocialMediaConnect = () => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleConnect = useCallback(async (platform: "instagram" | "facebook" | "tiktok") => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to connect your social media accounts.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(platform);
    try {
      const { data, error } = await supabase.functions.invoke('social-connect', {
        body: { platform },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No OAuth URL returned');

      // Redirect to OAuth URL
      window.location.href = data.url;
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
  }, [toast]);

  const handleExtractStyle = useCallback(async () => {
    const handle = prompt("Enter an Instagram handle to analyze:");
    if (!handle) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to analyze social media profiles.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { error } = await supabase.functions.invoke('social-extract', {
        body: { 
          platform: 'instagram',
          targetHandle: handle
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Analysis Complete",
        description: "Style profile has been created from social media content.",
      });
    } catch (error) {
      console.error('Style extraction error:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze profile. Please check the handle and try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [toast]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Button
          variant="outline"
          onClick={() => handleConnect("instagram")}
          disabled={!!isLoading}
          className="w-full h-auto py-6 px-4"
        >
          {isLoading === "instagram" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Instagram className="mr-2 h-4 w-4" />
          )}
          {isLoading === "instagram" ? "Connecting..." : "Connect Instagram"}
        </Button>
        
        <Button
          variant="outline"
          onClick={() => handleConnect("facebook")}
          disabled={!!isLoading}
          className="w-full h-auto py-6 px-4"
        >
          {isLoading === "facebook" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Facebook className="mr-2 h-4 w-4" />
          )}
          {isLoading === "facebook" ? "Connecting..." : "Connect Facebook"}
        </Button>
        
        <Button
          variant="outline"
          onClick={() => handleConnect("tiktok")}
          disabled={!!isLoading}
          className="w-full h-auto py-6 px-4"
        >
          {isLoading === "tiktok" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Video className="mr-2 h-4 w-4" />
          )}
          {isLoading === "tiktok" ? "Connecting..." : "Connect TikTok"}
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
        onClick={handleExtractStyle}
        className="w-full"
        disabled={isAnalyzing}
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          'Analyze Social Profile'
        )}
      </Button>
    </div>
  );
};