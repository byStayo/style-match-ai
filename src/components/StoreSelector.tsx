import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Store } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type Store = Database['public']['Tables']['stores']['Row'];
type UserStorePreference = Database['public']['Tables']['user_store_preferences']['Row'];

export const StoreSelector = () => {
  const { toast } = useToast();
  const [selectedStores, setSelectedStores] = useState<string[]>([]);

  const { data: stores, isLoading } = useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      return data as Store[];
    },
  });

  const handleStoreSelect = async (storeId: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;
    
    if (!session?.user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save your store preferences",
        variant: "destructive",
      });
      return;
    }

    try {
      if (selectedStores.includes(storeId)) {
        setSelectedStores(selectedStores.filter((id) => id !== storeId));
        await supabase
          .from('user_store_preferences')
          .delete()
          .match({ user_id: session.user.id, store_id: storeId });
      } else {
        setSelectedStores([...selectedStores, storeId]);
        await supabase
          .from('user_store_preferences')
          .upsert({ 
            user_id: session.user.id, 
            store_id: storeId,
            is_favorite: true 
          });
      }

      toast({
        title: "Preferences updated",
        description: "Your store preferences have been saved",
      });
    } catch (error) {
      console.error("Error updating store preferences:", error);
      toast({
        title: "Error",
        description: "Failed to update store preferences",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadUserPreferences = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      if (!session?.user) return;

      const { data } = await supabase
        .from('user_store_preferences')
        .select('store_id')
        .eq('user_id', session.user.id)
        .eq('is_favorite', true);

      if (data) {
        setSelectedStores(data.map((pref) => pref.store_id));
      }
    };

    loadUserPreferences();
  }, []);

  if (isLoading) {
    return <div>Loading stores...</div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {stores?.map((store) => (
        <Button
          key={store.id}
          variant={selectedStores.includes(store.id) ? "default" : "outline"}
          className="w-full h-auto py-4 px-6 flex flex-col items-center gap-2"
          onClick={() => handleStoreSelect(store.id)}
        >
          {store.logo_url ? (
            <img
              src={store.logo_url}
              alt={store.name}
              className="w-8 h-8 object-contain"
            />
          ) : (
            <Store className="w-8 h-8" />
          )}
          <span>{store.name}</span>
        </Button>
      ))}
    </div>
  );
};