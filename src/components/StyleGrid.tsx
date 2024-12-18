import { useState, useEffect } from "react";
import { ProductSort } from "./product/ProductSort";
import { ProductFilters } from "./product/ProductFilters";
import { ProductGridSkeleton } from "./product/ProductGridSkeleton";
import { EmptyProductGrid } from "./product/EmptyProductGrid";
import { ProductGrid } from "./product/ProductGrid";
import { ProductPagination } from "./product/ProductPagination";
import { MatchAnalytics } from "./product/MatchAnalytics";
import { useStyleMatches } from "@/hooks/useStyleMatches";
import { useProductFilters } from "@/hooks/useProductFilters";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "./ui/button";
import { RefreshCw } from "lucide-react";
import type { SortOption } from "@/components/product/ProductSort";

const ITEMS_PER_PAGE = 9; // Show 9 items per page (3x3 grid)

export const StyleGrid = () => {
  const [sortBy, setSortBy] = useState<SortOption>("match");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { items, isLoading, error, fetchMatches, toggleFavorite } = useStyleMatches();
  const { userData } = useAuth();
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

  const handleRefresh = async () => {
    if (!userData?.id) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to refresh matches.",
        variant: "destructive",
      });
      return;
    }
    
    setIsRefreshing(true);
    try {
      await fetchMatches(sortBy);
      toast({
        title: "Matches Refreshed",
        description: "Your style matches have been updated.",
      });
    } catch (error) {
      console.error('Error refreshing matches:', error);
      toast({
        title: "Error",
        description: "Failed to refresh matches. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const loadMatches = async () => {
      if (!userData?.id) {
        console.log("No user found, skipping match loading");
        return;
      }

      try {
        console.log("Loading matches for user:", userData.id);
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
  }, [userData, sortBy]);

  if (error) {
    return (
      <div className="text-center p-8">
        <h3 className="text-xl font-semibold text-red-600">Error Loading Matches</h3>
        <p className="text-muted-foreground mt-2">{error.message}</p>
        <Button 
          variant="outline" 
          onClick={handleRefresh} 
          className="mt-4"
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <ProductGridSkeleton />;
  }

  if (!userData) {
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
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAnalytics ? "Hide Analytics" : "Show Analytics"}
          </button>
          <ProductSort sortBy={sortBy} onSort={setSortBy} />
        </div>
      </div>
      
      {showAnalytics && <MatchAnalytics matches={items} />}
      
      <ProductGrid items={paginatedItems} onFavorite={toggleFavorite} />
      
      <ProductPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};