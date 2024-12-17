import { useState, useEffect } from "react";
import { ProductCard } from "./product/ProductCard";
import { ProductSort } from "./product/ProductSort";
import { ProductFilters, FilterOptions } from "./product/ProductFilters";
import { ProductGridSkeleton } from "./product/ProductGridSkeleton";
import { EmptyProductGrid } from "./product/EmptyProductGrid";
import { useStyleMatches } from "@/hooks/useStyleMatches";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { SortOption } from "@/components/product/ProductSort";

export const StyleGrid = () => {
  const [sortBy, setSortBy] = useState<SortOption>("match");
  const [filters, setFilters] = useState<FilterOptions>({
    stores: [],
    styleCategories: [],
  });
  
  const { items, isLoading, error, fetchMatches, toggleFavorite } = useStyleMatches();
  const { user } = useAuth();
  const { toast } = useToast();

  // Get unique stores and categories from items
  const availableStores = Array.from(new Set(items.map((item) => item.store_name)));
  const availableCategories = Array.from(
    new Set(items.flatMap((item) => item.style_tags || []))
  );

  // Filter items based on current filters
  const filteredItems = items.filter((item) => {
    if (filters.minPrice && item.product_price < filters.minPrice) return false;
    if (filters.maxPrice && item.product_price > filters.maxPrice) return false;
    if (filters.stores.length && !filters.stores.includes(item.store_name)) return false;
    if (
      filters.styleCategories.length &&
      !filters.styleCategories.some((cat) => item.style_tags?.includes(cat))
    )
      return false;
    return true;
  });

  useEffect(() => {
    const loadMatches = async () => {
      if (!user) {
        console.log("No user found, skipping match loading");
        return;
      }

      try {
        console.log("Loading matches for user:", user.id);
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

  if (error) {
    return (
      <div className="text-center p-8">
        <h3 className="text-xl font-semibold text-red-600">Error Loading Matches</h3>
        <p className="text-muted-foreground mt-2">{error.message}</p>
      </div>
    );
  }

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
      <div className="flex items-center justify-between">
        <ProductFilters
          onFilterChange={setFilters}
          availableStores={availableStores}
          availableCategories={availableCategories}
        />
        <ProductSort sortBy={sortBy} onSort={setSortBy} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
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