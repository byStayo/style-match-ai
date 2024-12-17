import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ExternalLink, ArrowUpDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ProductMatch = {
  id: string;
  product_url: string;
  product_image: string;
  product_title: string;
  product_price: number;
  store_name: string;
  match_score: number;
  match_explanation: string | null;
  is_favorite: boolean;
  created_at: string;
};

type SortOption = "match" | "price" | "new";

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

  const sortItems = (newSortBy: SortOption) => {
    setSortBy(newSortBy);
    fetchMatches();
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="aspect-square bg-muted" />
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardContent>
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
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Sort by {sortBy === "match" ? "Match Score" : sortBy === "price" ? "Price" : "New Arrivals"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => sortItems("match")}>
              Match Score
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => sortItems("price")}>
              Price
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => sortItems("new")}>
              New Arrivals
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card key={item.id} className="group overflow-hidden animate-fade-in">
            <CardHeader className="p-0">
              <div className="relative aspect-square">
                <img
                  src={item.product_image}
                  alt={item.product_title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute top-2 right-2 bg-black/75 text-white px-2 py-1 rounded-full text-sm">
                  {Math.round(item.match_score * 100)}% Match
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleFavorite(item.id)}
                  className={`absolute top-2 left-2 ${
                    item.is_favorite 
                      ? 'text-primary bg-white hover:bg-white/90'
                      : 'text-white hover:text-primary bg-black/50 hover:bg-white'
                  }`}
                >
                  <Heart className="h-5 w-5" fill={item.is_favorite ? "currentColor" : "none"} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                <CardTitle className="text-lg line-clamp-1">{item.product_title}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.match_explanation || `This item matches your style preferences`}
                </p>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">${item.product_price.toFixed(2)}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => window.open(item.product_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                    {item.store_name}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};