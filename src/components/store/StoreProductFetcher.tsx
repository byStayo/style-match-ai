import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Store, RefreshCw } from "lucide-react";

export const StoreProductFetcher = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [analysisProvider, setAnalysisProvider] = useState<'huggingface' | 'openai'>('huggingface');
  const { toast } = useToast();

  const handleFetchProducts = async () => {
    if (!selectedStore) {
      toast({
        title: "Store Required",
        description: "Please select a store first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgress(10);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Authentication required");
      }

      const response = await supabase.functions.invoke('fetch-store-products', {
        body: { 
          storeName: selectedStore,
          analysisProvider 
        },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (response.error) throw new Error(response.error.message);

      setProgress(100);
      toast({
        title: "Success",
        description: `Products fetched and analyzed from ${selectedStore}.`,
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch products",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Store className="w-5 h-5" />
        Store Product Fetcher
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Store</label>
          <Select
            value={selectedStore}
            onValueChange={setSelectedStore}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a store" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="zara">Zara</SelectItem>
              <SelectItem value="hm">H&M</SelectItem>
              <SelectItem value="uniqlo">Uniqlo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Analysis Provider</label>
          <Select
            value={analysisProvider}
            onValueChange={(value: 'huggingface' | 'openai') => setAnalysisProvider(value)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select analysis provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="huggingface">Hugging Face (Default)</SelectItem>
              <SelectItem value="openai">OpenAI Vision</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground text-center">
              Fetching and analyzing products...
            </p>
          </div>
        )}

        <Button
          onClick={handleFetchProducts}
          disabled={isLoading || !selectedStore}
          className="w-full"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Store className="w-4 h-4 mr-2" />
          )}
          {isLoading ? "Processing..." : "Fetch Products"}
        </Button>
      </div>
    </div>
  );
};