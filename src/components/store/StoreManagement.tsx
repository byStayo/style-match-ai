import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Store, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface StorePreference {
  id: string;
  name: string;
  url: string;
  logo_url: string | null;
  is_active: boolean;
}

export const StoreManagement = () => {
  const [stores, setStores] = useState<StorePreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const toggleStore = async (storeId: string, isActive: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_store_preferences')
        .upsert({
          user_id: user.id,
          store_id: storeId,
          is_favorite: isActive,
        });

      if (error) throw error;

      setStores(stores.map(store => 
        store.id === storeId ? { ...store, is_active: isActive } : store
      ));

      toast({
        title: isActive ? "Store Activated" : "Store Deactivated",
        description: `Store preferences updated successfully.`,
      });
    } catch (error) {
      console.error('Error updating store preference:', error);
      toast({
        title: "Error",
        description: "Failed to update store preferences.",
        variant: "destructive",
      });
    }
  };

  const refreshStoreProducts = async (storeId: string, storeName: string) => {
    try {
      const { error } = await supabase.functions.invoke('fetch-store-products', {
        body: { storeName },
      });

      if (error) throw error;

      toast({
        title: "Products Updated",
        description: `Successfully refreshed products from ${storeName}.`,
      });
    } catch (error) {
      console.error('Error refreshing store products:', error);
      toast({
        title: "Error",
        description: "Failed to refresh store products.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="w-5 h-5" />
          Store Management
        </CardTitle>
        <CardDescription>
          Manage your connected stores and product updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {stores.map((store) => (
          <div key={store.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              {store.logo_url && (
                <img 
                  src={store.logo_url} 
                  alt={store.name} 
                  className="w-8 h-8 object-contain"
                />
              )}
              <div>
                <h3 className="font-medium">{store.name}</h3>
                <p className="text-sm text-muted-foreground">{store.url}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => refreshStoreProducts(store.id, store.name)}
                title="Refresh Products"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Switch
                checked={store.is_active}
                onCheckedChange={(checked) => toggleStore(store.id, checked)}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};