import { useState, useEffect } from "react";
import { ProductCard } from "./product/ProductCard";
import { ProductSort, SortOption } from "./product/ProductSort";
import { ProductGridSkeleton } from "./product/ProductGridSkeleton";
import { EmptyProductGrid } from "./product/EmptyProductGrid";
import { useStyleMatches } from "@/hooks/useStyleMatches";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "./ui/button";
import { Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const StyleGrid = () => {
  const [sortBy, setSortBy] = useState<SortOption>("match");
  const { items, isLoading, fetchMatches, toggleFavorite } = useStyleMatches();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const handleUploadClick = () => {
    navigate("/");
  };

  if (isLoading) {
    return <ProductGridSkeleton />;
  }

  if (!user) {
    return (
      <EmptyProductGrid 
        message="Please sign in to view your style matches"
        action={
          <Button variant="outline" onClick={handleUploadClick}>
            Sign in
          </Button>
        }
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyProductGrid 
        message="Upload some images to get personalized style matches"
        action={
          <Button onClick={handleUploadClick} className="gap-2">
            <Upload className="w-4 h-4" />
            Upload Images
          </Button>
        }
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