import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SupportedStoreList } from "./store/SupportedStoreList";
import { StoreRequestForm } from "./store/StoreRequestForm";
import { CustomStoreForm } from "./store/CustomStoreForm";
import type { SupportedStore } from "@/types/store";

export const StoreSelector = () => {
  const { toast } = useToast();
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: stores, isLoading } = useQuery({
    queryKey: ["supported-stores"],
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
      return data as SupportedStore[];
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
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
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="col-span-full lg:col-span-2">
          <h2 className="text-2xl font-semibold mb-4 text-center md:text-left">Supported Stores</h2>
          <SupportedStoreList
            stores={stores || []}
            selectedStores={selectedStores}
            onStoreSelect={handleStoreSelect}
            isProcessing={isProcessing}
          />
        </div>
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold mb-4 text-center md:text-left">Add More Stores</h2>
          <div className="grid grid-cols-1 gap-4">
            <CustomStoreForm />
            <StoreRequestForm />
          </div>
        </div>
      </div>
    </div>
  );
};
