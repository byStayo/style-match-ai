import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ExternalLink, Info, Store } from "lucide-react";
import { ProductMatch } from "@/types/product";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface ProductCardProps {
  item: ProductMatch;
  onFavorite: (id: string) => Promise<void>;
}

export const ProductCard = ({ item, onFavorite }: ProductCardProps) => {
  const matchPercentage = Math.round(item.match_score * 100);
  const matchColor = matchPercentage >= 90 
    ? 'bg-green-500' 
    : matchPercentage >= 70 
      ? 'bg-yellow-500' 
      : 'bg-gray-500';

  return (
    <Card className="group overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative aspect-square">
          <img
            src={item.product_image}
            alt={item.product_title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          <HoverCard>
            <HoverCardTrigger asChild>
              <div 
                className={`absolute top-2 right-2 ${matchColor} text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 cursor-help`}
              >
                <span className="font-medium">{matchPercentage}%</span>
                <Info className="h-4 w-4" />
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Match Details</h4>
                <p className="text-sm">{item.match_explanation}</p>
              </div>
            </HoverCardContent>
          </HoverCard>
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
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold line-clamp-2">{item.product_title}</h3>
            <span className="font-semibold whitespace-nowrap">${item.product_price.toFixed(2)}</span>
          </div>
          
          {/* Style Analysis Section */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {item.match_explanation || "This item matches your style preferences"}
            </p>
            {item.style_tags && item.style_tags.length > 0 && (
              <div className="space-y-1.5">
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

          <div className="flex justify-between items-center pt-3 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <Store className="h-4 w-4" />
              {item.store_name}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => window.open(item.product_url, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              View Item
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};