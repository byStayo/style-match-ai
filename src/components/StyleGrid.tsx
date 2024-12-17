import { useState, useEffect } from "react";
import { ProductSort } from "./product/ProductSort";
import { ProductFilters } from "./product/ProductFilters";
import { ProductGridSkeleton } from "./product/ProductGridSkeleton";
import { EmptyProductGrid } from "./product/EmptyProductGrid";
import { ProductGrid } from "./product/ProductGrid";
import { ProductPagination } from "./product/ProductPagination";
import { useStyleMatches } from "@/hooks/useStyleMatches";
import { useProductFilters } from "@/hooks/useProductFilters";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { SortOption } from "@/components/product/ProductSort";

const ITEMS_PER_PAGE = 9; // Show 9 items per page (3x3 grid)

export const StyleGrid = () => {
  const [sortBy, setSortBy] = useState<SortOption>("match");
  const { items, isLoading, error, fetchMatches, toggleFavorite } = useStyleMatches();
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    filters,
    setFilters,
    currentPage,
    setCurrentPage,
    filteredItems,
    availableStores,
    availableCategories,
  } = useProductFilters(items);

  // Calculate pagination
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      
      <ProductGrid items={paginatedItems} onFavorite={toggleFavorite} />
      
      <ProductPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};