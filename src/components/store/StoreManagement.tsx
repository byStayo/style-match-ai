import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Store } from 'lucide-react';
import { SupportedStoreList } from './SupportedStoreList';
import { CustomStoreForm } from './CustomStoreForm';
import { StoreRequestForm } from './StoreRequestForm';

export const StoreManagement = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: stores, isLoading, error } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      console.log('Fetching stores...');
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      console.log('Fetched stores:', data);
      return data;
    }
  });

  // Load user's selected stores
  useEffect(() => {
    const loadUserStores = async () => {
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

    loadUserStores();
  }, []);

  const handleStoreSelect = async (storeId: string, storeName: string) => {
    try {
      setIsProcessing(true);
      
      // Check if store products need updating
      const { data: lastScrape } = await supabase
        .from('store_scrape_logs')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const needsUpdate = !lastScrape || 
        new Date(lastScrape.created_at).getTime() < Date.now() - 24 * 60 * 60 * 1000;

      if (needsUpdate) {
        // Trigger store product fetch
        const { error: fetchError } = await supabase.functions.invoke('fetch-store-products', {
          body: { storeName }
        });

        if (fetchError) throw fetchError;

        toast({
          title: 'Store products updating',
          description: 'We\'re fetching the latest products. This may take a few minutes.',
        });
      }

      // Save user preference
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        const { error: prefError } = await supabase
          .from('user_store_preferences')
          .upsert({
            user_id: sessionData.session.user.id,
            store_id: storeId,
            is_favorite: true
          });

        if (prefError) throw prefError;

        // Update local state
        setSelectedStores(prev => 
          prev.includes(storeId) 
            ? prev.filter(id => id !== storeId)
            : [...prev, storeId]
        );
      }

      toast({
        title: 'Store connected',
        description: 'You\'ll now see products from this store in your matches.',
      });

    } catch (error) {
      console.error('Error managing store:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to manage store',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (error) {
    return (
      <div className="text-center p-8">
        <h3 className="text-xl font-semibold text-red-600">Error Loading Stores</h3>
        <p className="text-muted-foreground mt-2">{error instanceof Error ? error.message : 'Failed to load stores'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 gap-6">
        <section>
          <h2 className="text-2xl font-semibold text-center mb-6">Supported Stores</h2>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : stores?.length === 0 ? (
            <Card className="p-6 text-center">
              <Store className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-medium mt-4">No stores available</h3>
              <p className="text-muted-foreground mt-2">Please check back later for supported stores.</p>
            </Card>
          ) : (
            <SupportedStoreList
              stores={stores}
              selectedStores={selectedStores}
              onStoreSelect={handleStoreSelect}
              isProcessing={isProcessing}
            />
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-center mb-6">Add More Stores</h2>
          <div className="grid grid-cols-1 gap-4">
            <CustomStoreForm />
            <StoreRequestForm />
          </div>
        </section>
      </div>
    </div>
  );
};