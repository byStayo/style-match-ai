import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ExternalLink, Info } from "lucide-react";
import { ProductMatch } from "@/types/product";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProductCardProps {
  item: ProductMatch;
  onFavorite: (id: string) => Promise<void>;
}

export const ProductCard = ({ item, onFavorite }: ProductCardProps) => {
  return (
    <Card className="group overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative aspect-square">
          <img
            src={item.product_image}
            alt={item.product_title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute top-2 right-2 bg-black/75 text-white px-2 py-1 rounded-full text-sm flex items-center gap-1 cursor-help">
                  <span>{Math.round(item.match_score * 100)}% Match</span>
                  <Info className="h-4 w-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">{item.match_explanation}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold line-clamp-1">{item.product_title}</h3>
          
          {/* Style Analysis Section */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {item.match_explanation || "This item matches your style preferences"}
            </p>
            {item.style_tags && item.style_tags.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Style Elements:</p>
                <div className="flex flex-wrap gap-1">
                  {item.style_tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-2 border-t">
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
  );
};