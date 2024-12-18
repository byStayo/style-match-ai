import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Key, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const CustomStoreForm = () => {
  const { toast } = useToast();
  const [storeName, setStoreName] = useState("");
  const [storeUrl, setStoreUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkApiKey = async () => {
      console.log("Checking API key...");
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('openai_api_key')
        .eq('id', sessionData.session.user.id)
        .single();

      setHasApiKey(!!profile?.openai_api_key);
      console.log("Has API key:", !!profile?.openai_api_key);
    };

    checkApiKey();
  }, []);

  const handleAddCustomStore = async () => {
    if (!storeName || !storeUrl) {
      toast({
        title: "Missing information",
        description: "Please provide store name and URL",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("Adding custom store:", { storeName, storeUrl });
      
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) {
        throw new Error("Authentication required");
      }

      const { data: store, error: storeError } = await supabase
        .from('stores')
        .insert({
          name: storeName,
          url: storeUrl,
          integration_type: "scrape",
          is_active: true,
          owner_id: sessionData.session.user.id,
          is_official: false
        })
        .select()
        .single();

      if (storeError) throw storeError;

      // Trigger initial product fetch using the user's API key
      const { error: fetchError } = await supabase.functions.invoke('fetch-store-products', {
        body: { 
          storeName,
          userId: sessionData.session.user.id,
          analysisProvider: 'openai',
          useCustomKey: true 
        }
      });

      if (fetchError) throw fetchError;

      toast({
        title: "Store added successfully",
        description: "Products will be fetched and analyzed using your API key.",
      });

      setStoreName("");
      setStoreUrl("");
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding custom store:', error);
      toast({
        title: "Error",
        description: "Failed to add custom store. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasApiKey) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You need to configure your OpenAI API key in settings to add custom stores.
          This ensures product analysis costs are charged to your account.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-auto py-6 px-4 flex flex-col items-center gap-4 w-full animate-fade-in hover:bg-accent/5"
        >
          <Key className="w-12 h-12 text-primary" />
          <span className="text-lg font-medium">Add Custom Store</span>
          <span className="text-sm text-muted-foreground text-center">Using your own API key</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Custom Store</DialogTitle>
          <DialogDescription>
            Add a store using your own OpenAI API key. Analysis costs will be charged to your key.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="custom-store-name">Store Name</Label>
            <Input
              id="custom-store-name"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Enter store name"
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-store-url">Store URL</Label>
            <Input
              id="custom-store-url"
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full"
              type="url"
            />
          </div>
          <Button 
            onClick={handleAddCustomStore} 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding Store..." : "Add Store"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};