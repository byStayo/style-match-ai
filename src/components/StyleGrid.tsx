import { useState } from "react";
import { ProductCard } from "./product/ProductCard";
import { ProductSort, SortOption } from "./product/ProductSort";
import { ProductGridSkeleton } from "./product/ProductGridSkeleton";
import { EmptyProductGrid } from "./product/EmptyProductGrid";
import { useStyleMatches } from "@/hooks/useStyleMatches";

export const StyleGrid = () => {
  const [sortBy, setSortBy] = useState<SortOption>("match");
  const { items, isLoading, fetchMatches, toggleFavorite } = useStyleMatches();

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