import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProductMatch } from "@/types/product";
import { SortOption } from "@/components/product/ProductSort";

interface MatchProductsResponse {
  id: string;
  product_url: string;
  product_image: string;
  product_title: string;
  product_price: number;
  store_name: string;
  similarity: number;
}

export const useStyleMatches = () => {
  const [items, setItems] = useState<ProductMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchMatches = async (sortBy: SortOption = 'match') => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        setItems([]);
        setIsLoading(false);
        return;
      }

      // First get the user's latest style upload embedding
      const { data: styleUploads } = await supabase
        .from('style_uploads')
        .select('embedding')
        .eq('user_id', session.session.user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!styleUploads?.[0]?.embedding) {
        setItems([]);
        setIsLoading(false);
        return;
      }

      // Get user's store preferences
      const { data: storePrefs } = await supabase
        .from('user_store_preferences')
        .select('store_id')
        .eq('user_id', session.session.user.id)
        .eq('is_favorite', true);

      const storeIds = (storePrefs || []).map(pref => pref.store_id);

      // Call the match_products function
      const { data: matches, error } = await supabase
        .rpc('match_products', {
          query_embedding: styleUploads[0].embedding,
          similarity_threshold: 0.5,
          match_count: 30,
          store_filter: storeIds
        });

      if (error) throw error;

      // Transform matches into ProductMatch format
      const productMatches: ProductMatch[] = (matches as MatchProductsResponse[]).map(match => ({
        id: match.id,
        product_url: match.product_url,
        product_image: match.product_image,
        product_title: match.product_title,
        product_price: match.product_price,
        store_name: match.store_name,
        match_score: match.similarity,
        match_explanation: `This item matches your style with ${Math.round(match.similarity * 100)}% confidence`,
        is_favorite: false
      }));

      // Sort matches based on user preference
      const sortedMatches = sortMatches(productMatches, sortBy);
      setItems(sortedMatches);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast({
        title: "Error",
        description: "Failed to load style matches. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sortMatches = (matches: ProductMatch[], sortBy: SortOption): ProductMatch[] => {
    return [...matches].sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.product_price - b.product_price;
        case 'date':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'match':
        default:
          return b.match_score - a.match_score;
      }
    });
  };

  const toggleFavorite = async (id: string) => {
    try {
      const item = items.find(i => i.id === id);
      if (!item) return;

      const { error } = await supabase
        .from('product_matches')
        .update({ is_favorite: !item.is_favorite })
        .eq('id', id);

      if (error) throw error;

      setItems(items.map(item => 
        item.id === id ? { ...item, is_favorite: !item.is_favorite } : item
      ));

      toast({
        title: item.is_favorite ? "Removed from favorites" : "Added to favorites",
        description: `${item.product_title} has been ${item.is_favorite ? 'removed from' : 'added to'} your favorites.`,
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorite status. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    items,
    isLoading,
    fetchMatches,
    toggleFavorite
  };
};