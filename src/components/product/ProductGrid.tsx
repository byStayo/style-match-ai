import { ProductCard } from "./ProductCard";
import type { ProductMatch } from "@/types/product";

interface ProductGridProps {
  items: ProductMatch[];
  onFavorite: (id: string) => Promise<void>;
}

export const ProductGrid = ({ items, onFavorite }: ProductGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <ProductCard 
          key={item.id} 
          item={item} 
          onFavorite={onFavorite}
        />
      ))}
    </div>
  );
};