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
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

export const StoreRequestForm = () => {
  const { toast } = useToast();
  const [storeName, setStoreName] = useState("");
  const [storeUrl, setStoreUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitRequest = async () => {
    if (!storeName || !storeUrl) {
      toast({
        title: "Missing information",
        description: "Please provide both store name and URL",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const { error } = await supabase.from('store_requests').insert({
        store_name: storeName,
        store_url: storeUrl,
        status: 'pending'
      });

      if (error) throw error;

      toast({
        title: "Request submitted",
        description: "We'll review your store request and get back to you.",
      });

      setStoreName("");
      setStoreUrl("");
    } catch (error) {
      console.error('Error submitting store request:', error);
      toast({
        title: "Error",
        description: "Failed to submit store request. Please try again.",
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
          <Plus className="w-12 h-12" />
          <span className="text-lg font-medium">Request New Store</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request New Store Integration</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store-name">Store Name</Label>
            <Input
              id="store-name"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Enter store name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="store-url">Store URL</Label>
            <Input
              id="store-url"
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <Button 
            onClick={handleSubmitRequest} 
            className="w-full"
            disabled={isSubmitting}
          >
            Submit Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};