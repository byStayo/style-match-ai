import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Store, Plus, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const StoreSelector = () => {
  const { toast } = useToast();
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customStoreName, setCustomStoreName] = useState("");
  const [customStoreUrl, setCustomStoreUrl] = useState("");

  const { data: stores, isLoading } = useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching stores:', error);
        throw error;
      }
      return data;
    },
  });

  const handleStoreSelect = async (storeId: string, storeName: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to save your store preferences",
          variant: "destructive",
        });
        return;
      }

      setIsProcessing(true);

      if (selectedStores.includes(storeId)) {
        setSelectedStores(prev => prev.filter(id => id !== storeId));
        await supabase
          .from('user_store_preferences')
          .delete()
          .match({ 
            user_id: sessionData.session.user.id, 
            store_id: storeId 
          });
      } else {
        setSelectedStores(prev => [...prev, storeId]);
        await supabase
          .from('user_store_preferences')
          .upsert({ 
            user_id: sessionData.session.user.id, 
            store_id: storeId,
            is_favorite: true 
          });

        // Trigger store scraping
        const { error: scrapeError } = await supabase.functions.invoke('scrape-store', {
          body: { store: storeName }
        });

        if (scrapeError) throw scrapeError;

        toast({
          title: "Store products are being processed",
          description: "We'll analyze the products and find matches for your style.",
        });
      }
    } catch (error) {
      console.error('Error updating store preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update store preferences",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddCustomStore = async () => {
    if (!customStoreName || !customStoreUrl) {
      toast({
        title: "Missing information",
        description: "Please provide both store name and URL",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('stores')
        .insert({
          name: customStoreName,
          url: customStoreUrl,
          integration_type: 'scrape',
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Store added",
        description: "Custom store has been added successfully.",
      });

      setCustomStoreName("");
      setCustomStoreUrl("");
    } catch (error) {
      console.error('Error adding custom store:', error);
      toast({
        title: "Error",
        description: "Failed to add custom store",
        variant: "destructive",
      });
    }
  };

  // Load user's store preferences
  useEffect(() => {
    const loadUserPreferences = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) return;

      const { data: preferences } = await supabase
        .from('user_store_preferences')
        .select('store_id')
        .eq('user_id', sessionData.session.user.id)
        .eq('is_favorite', true);

      if (preferences) {
        setSelectedStores(preferences.map(pref => pref.store_id));
      }
    };

    loadUserPreferences();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-8 w-8 rounded-full mb-4" />
            <Skeleton className="h-4 w-24" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stores?.map((store) => (
          <Button
            key={store.id}
            variant={selectedStores.includes(store.id) ? "default" : "outline"}
            className="h-auto py-6 px-4 flex flex-col items-center gap-4 relative group"
            onClick={() => handleStoreSelect(store.id, store.name)}
            disabled={isProcessing}
          >
            {selectedStores.includes(store.id) && (
              <div className="absolute top-2 right-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Integrated</span>
              </div>
            )}
            {store.logo_url ? (
              <img
                src={store.logo_url}
                alt={store.name}
                className="w-12 h-12 object-contain"
              />
            ) : (
              <Store className="w-12 h-12" />
            )}
            <span className="text-lg font-medium">{store.name}</span>
          </Button>
        ))}

        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="h-auto py-6 px-4 flex flex-col items-center gap-4"
            >
              <Plus className="w-12 h-12" />
              <span className="text-lg font-medium">Add Custom Store</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Store</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="store-name">Store Name</Label>
                <Input
                  id="store-name"
                  value={customStoreName}
                  onChange={(e) => setCustomStoreName(e.target.value)}
                  placeholder="Enter store name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store-url">Store URL</Label>
                <Input
                  id="store-url"
                  value={customStoreUrl}
                  onChange={(e) => setCustomStoreUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <Button onClick={handleAddCustomStore} className="w-full">
                Add Store
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};