import { useState, useEffect } from "react";
import { ProductCard } from "./product/ProductCard";
import { ProductSort, SortOption } from "./product/ProductSort";
import { ProductGridSkeleton } from "./product/ProductGridSkeleton";
import { EmptyProductGrid } from "./product/EmptyProductGrid";
import { useStyleMatches } from "@/hooks/useStyleMatches";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const StyleGrid = () => {
  const [sortBy, setSortBy] = useState<SortOption>("match");
  const { items, isLoading, fetchMatches, toggleFavorite } = useStyleMatches();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const loadMatches = async () => {
      if (!user) return;

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) return;

        const response = await supabase.functions.invoke('match-style', {
          body: { 
            userId: user.id,
            minSimilarity: 0.5,
            limit: 30
          },
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
        });

        if (response.error) throw response.error;
        
        // Matches are automatically saved to product_matches table
        await fetchMatches(sortBy);

      } catch (error) {
        console.error('Error loading style matches:', error);
        toast({
          title: "Error",
          description: "Failed to load style matches. Please try again.",
          variant: "destructive",
        });
      }
    };

    loadMatches();
  }, [user]);

  const handleSort = (newSortBy: SortOption) => {
    setSortBy(newSortBy);
    fetchMatches(newSortBy);
  };

  if (isLoading) {
    return <ProductGridSkeleton />;
  }

  if (items.length === 0) {
    return <EmptyProductGrid />;
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