import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ExternalLink, Store } from "lucide-react";
import { ProductMatch } from "@/types/product";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ProductCardProps {
  item: ProductMatch;
  onFavorite: (id: string) => Promise<void>;
}

export const ProductCard = ({ item, onFavorite }: ProductCardProps) => {
  const matchPercentage = Math.round(item.match_score * 100);
  const matchColor = matchPercentage > 80 ? "bg-green-500" : 
                    matchPercentage > 60 ? "bg-yellow-500" : "bg-gray-500";

  return (
    <Card className="group overflow-hidden animate-fade-in">
      <CardHeader className="p-0">
        <div className="relative aspect-square">
          <img
            src={item.product_image}
            alt={item.product_title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          <Badge 
            className={`absolute top-2 right-2 ${matchColor} text-white`}
            variant="secondary"
          >
            {matchPercentage}% Match
          </Badge>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onFavorite(item.id)}
                className={`absolute top-2 left-2 ${
                  item.is_favorite 
                    ? 'text-primary bg-white hover:bg-white/90'
                    : 'text-white hover:text-primary bg-black/50 hover:bg-white'
                }`}
              >
                <Heart className="h-5 w-5" fill={item.is_favorite ? "currentColor" : "none"} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {item.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold line-clamp-1">{item.product_title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.match_explanation || `This item matches your style preferences`}
          </p>
          <div className="flex justify-between items-center gap-2">
            <span className="font-semibold">${item.product_price.toFixed(2)}</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="gap-2"
                onClick={() => window.open(item.product_url, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                View
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="secondary" 
                    size="icon"
                    className="h-8 w-8"
                  >
                    <Store className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Available at {item.store_name}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};