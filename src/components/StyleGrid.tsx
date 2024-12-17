import { Card, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "./product/ProductCard";
import { ProductSort, SortOption } from "./product/ProductSort";
import { ProductMatch } from "@/types/product";

export const StyleGrid = () => {
  const [items, setItems] = useState<ProductMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("match");
  const { toast } = useToast();

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        setItems([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('product_matches')
        .select('*')
        .order(sortBy === 'match' ? 'match_score' : sortBy === 'price' ? 'product_price' : 'created_at', 
               { ascending: sortBy === 'price' });

      if (error) throw error;

      setItems(data || []);
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

  const handleSort = (newSortBy: SortOption) => {
    setSortBy(newSortBy);
    fetchMatches();
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="aspect-square bg-muted" />
            <div className="p-4">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CardTitle className="mb-2">No matches yet</CardTitle>
        <p className="text-muted-foreground">
          Upload some images or connect your social media to get personalized style matches.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ProductSort sortBy={sortBy} onSort={handleSort} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <ProductCard 
            key={item.id} 
            item={item} 
            onFavorite={toggleFavorite}
          />
        ))}
      </div>
    </div>
  );
};