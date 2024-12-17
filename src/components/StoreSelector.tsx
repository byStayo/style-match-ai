import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Store, ShoppingBag, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type StoreType = {
  id: string;
  name: string;
  logo: string;
  isIntegrated: boolean;
};

const popularStores: StoreType[] = [
  { id: "1", name: "ASOS", logo: "/placeholder.svg", isIntegrated: true },
  { id: "2", name: "Zara", logo: "/placeholder.svg", isIntegrated: true },
  { id: "3", name: "H&M", logo: "/placeholder.svg", isIntegrated: true },
  { id: "4", name: "Uniqlo", logo: "/placeholder.svg", isIntegrated: true },
  { id: "5", name: "Mango", logo: "/placeholder.svg", isIntegrated: true },
  { id: "6", name: "Nike", logo: "/placeholder.svg", isIntegrated: true }
];

export const StoreSelector = () => {
  const { toast } = useToast();
  const [customUrl, setCustomUrl] = useState("");

  const handleStoreSelect = async (store: StoreType) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to select stores.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: `Selected ${store.name}`,
        description: `Connecting to ${store.name}'s product catalog...`,
        duration: 3000
      });

      // Update user preferences in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: {
            selectedStores: {
              [store.id]: {
                name: store.name,
                connected: true,
                lastSync: new Date().toISOString()
              }
            }
          }
        })
        .eq('id', session.session.user.id);

      if (error) throw error;

      toast({
        title: "Store Connected",
        description: `Successfully connected to ${store.name}.`,
      });
    } catch (error) {
      console.error('Store selection error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to store. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCustomUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl) return;

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to add custom stores.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Processing Custom Store",
        description: "Analyzing products from the provided URL...",
        duration: 3000
      });

      // Save custom store URL to user preferences
      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: {
            customStores: [
              {
                url: customUrl,
                added: new Date().toISOString()
              }
            ]
          }
        })
        .eq('id', session.session.user.id);

      if (error) throw error;

      setCustomUrl("");
      toast({
        title: "Store Added",
        description: "Custom store has been added successfully.",
      });
    } catch (error) {
      console.error('Custom store error:', error);
      toast({
        title: "Failed to Add Store",
        description: "Could not add custom store. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Store className="h-5 w-5" />
          Popular Stores
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {popularStores.map((store) => (
            <Card
              key={store.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleStoreSelect(store)}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center space-y-2">
                <img
                  src={store.logo}
                  alt={store.name}
                  className="w-16 h-16 object-contain"
                />
                <p className="font-medium text-center">{store.name}</p>
                {store.isIntegrated && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <ShoppingBag className="h-3 w-3" />
                    Integrated
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Add Custom Store
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCustomUrlSubmit} className="flex gap-2">
              <Input
                type="url"
                placeholder="Paste store URL here..."
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={!customUrl}>
                Add Store
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};