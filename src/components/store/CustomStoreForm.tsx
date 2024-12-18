import { useState } from "react";
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
import { Plus, Key } from "lucide-react";

export const CustomStoreForm = () => {
  const { toast } = useToast();
  const [storeName, setStoreName] = useState("");
  const [storeUrl, setStoreUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCustomStore = async () => {
    if (!storeName || !storeUrl || !apiKey) {
      toast({
        title: "Missing information",
        description: "Please provide store name, URL, and API key",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) {
        throw new Error("Authentication required");
      }

      const { error } = await supabase.from('stores').insert({
        name: storeName,
        url: storeUrl,
        integration_type: 'api',
        is_active: true,
        api_key: apiKey,
        owner_id: sessionData.session.user.id
      });

      if (error) throw error;

      toast({
        title: "Store added",
        description: "Custom store has been added successfully. Products will be fetched using your API key.",
      });

      setStoreName("");
      setStoreUrl("");
      setApiKey("");
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-auto py-6 px-4 flex flex-col items-center gap-4"
        >
          <Key className="w-12 h-12" />
          <span className="text-lg font-medium">Add Custom Store</span>
          <span className="text-sm text-muted-foreground">Using your own API key</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Custom Store</DialogTitle>
          <DialogDescription>
            Add a store using your own API key. API usage costs will be charged to your key.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="custom-store-name">Store Name</Label>
            <Input
              id="custom-store-name"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Enter store name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-store-url">Store URL</Label>
            <Input
              id="custom-store-url"
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="api-key">Store API Key</Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
            />
          </div>
          <Button 
            onClick={handleAddCustomStore} 
            className="w-full"
            disabled={isSubmitting}
          >
            Add Store
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};