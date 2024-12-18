import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProductMatch } from "@/types/product";
import { SortOption } from "@/components/product/ProductSort";

export const useStyleMatches = () => {
  const [items, setItems] = useState<ProductMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchMatches = async (sortBy: SortOption = 'match') => {
    try {
      setError(null);
      setIsLoading(true);

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        setItems([]);
        return;
      }

      // Get the user's latest style upload
      const { data: uploads, error: uploadsError } = await supabase
        .from('style_uploads')
        .select('id')
        .eq('user_id', session.session.user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (uploadsError) throw uploadsError;
      if (!uploads?.length) {
        console.log('No style uploads found');
        setItems([]);
        return;
      }

      // Get previous matches to detect new ones
      const previousMatches = new Set(items.map(item => item.id));

      // Get matches using the edge function
      const { data: matchesData, error: matchError } = await supabase.functions
        .invoke('match-products', {
          body: { 
            styleUploadId: uploads[0].id,
            minSimilarity: 0.7,
            limit: 20
          }
        });

      if (matchError) throw matchError;

      // Sort matches based on user preference
      const sortedMatches = sortMatches(matchesData.matches, sortBy);
      setItems(sortedMatches);

      // Find new matches
      const newMatches = sortedMatches.filter(match => !previousMatches.has(match.id));

      if (newMatches.length > 0) {
        toast({
          title: "New Matches Found!",
          description: `Found ${newMatches.length} new items matching your style.`,
        });
      }

    } catch (error) {
      console.error('Error fetching matches:', error);
      setError(error instanceof Error ? error : new Error('Failed to load matches'));
      toast({
        title: "Error",
        description: "Failed to load style matches. Please try uploading an image first.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sortMatches = (matches: ProductMatch[], sortBy: SortOption): ProductMatch[] => {
    return [...matches].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.product_price - b.product_price;
        case 'price-desc':
          return b.product_price - a.product_price;
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
    error,
    fetchMatches,
    toggleFavorite
  };
};