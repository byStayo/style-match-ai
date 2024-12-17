import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Store } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const StoreSelector = () => {
  const { toast } = useToast();
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: stores, isLoading } = useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true);

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
            className="h-auto py-6 px-4 flex flex-col items-center gap-4"
            onClick={() => handleStoreSelect(store.id, store.name)}
            disabled={isProcessing}
          >
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
      </div>
    </div>
  );
};