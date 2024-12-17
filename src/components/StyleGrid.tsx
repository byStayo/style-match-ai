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
      if (!user) {
        console.log("No user found, skipping match loading");
        return;
      }

      try {
        console.log("Loading matches for user:", user.id);
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          console.log("No active session found");
          return;
        }

        // Fetch matches
        await fetchMatches(sortBy);

      } catch (error) {
        console.error('Error loading style matches:', error);
        toast({
          title: "Error",
          description: "Failed to load style matches. Please try uploading an image first.",
          variant: "destructive",
        });
      }
    };

    loadMatches();
  }, [user, sortBy]);

  if (isLoading) {
    return <ProductGridSkeleton />;
  }

  if (!user) {
    return (
      <EmptyProductGrid 
        message="Please sign in to view your style matches"
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyProductGrid 
        message="Upload some images to get personalized style matches"
      />
    );
  }

  return (
    <div className="space-y-6">
      <ProductSort sortBy={sortBy} onSort={setSortBy} />
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