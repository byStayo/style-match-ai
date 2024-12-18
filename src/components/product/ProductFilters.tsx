import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, X, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface FilterOptions {
  stores: string[];
  styleCategories: string[];
  minPrice?: number;
  maxPrice?: number;
}

interface ProductFiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
  availableStores: string[];
  availableCategories: string[];
}

export const ProductFilters = ({
  onFilterChange,
  availableStores,
  availableCategories,
}: ProductFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [storeLogos, setStoreLogos] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchStoreLogos = async () => {
      const { data: stores } = await supabase
        .from('stores')
        .select('name, logo_url')
        .in('name', availableStores);

      if (stores) {
        const logos = stores.reduce((acc, store) => ({
          ...acc,
          [store.name]: store.logo_url
        }), {});
        setStoreLogos(logos);
      }
    };

    fetchStoreLogos();
  }, [availableStores]);

  const handleStoreToggle = (store: string) => {
    const newStores = selectedStores.includes(store)
      ? selectedStores.filter((s) => s !== store)
      : [...selectedStores, store];
    setSelectedStores(newStores);
    updateFilters(newStores, selectedCategories, priceRange);
  };

  const handleCategoryToggle = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    setSelectedCategories(newCategories);
    updateFilters(selectedStores, newCategories, priceRange);
  };

  const handlePriceChange = (value: number[]) => {
    const range: [number, number] = [value[0], value[1]];
    setPriceRange(range);
    updateFilters(selectedStores, selectedCategories, range);
  };

  const updateFilters = (
    stores: string[],
    categories: string[],
    [min, max]: [number, number]
  ) => {
    onFilterChange({
      stores,
      styleCategories: categories,
      minPrice: min,
      maxPrice: max,
    });
  };

  const clearFilters = () => {
    setSelectedStores([]);
    setSelectedCategories([]);
    setPriceRange([0, 1000]);
    onFilterChange({
      stores: [],
      styleCategories: [],
    });
  };

  const activeFilterCount =
    selectedStores.length + selectedCategories.length + (priceRange[0] > 0 || priceRange[1] < 1000 ? 1 : 0);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Filters</SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground"
            >
              Clear all
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Price Range</h3>
            <Slider
              min={0}
              max={1000}
              step={10}
              value={[priceRange[0], priceRange[1]]}
              onValueChange={handlePriceChange}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Store className="w-4 h-4" />
              Stores
            </h3>
            <div className="flex flex-wrap gap-2">
              {availableStores.map((store) => (
                <Badge
                  key={store}
                  variant={selectedStores.includes(store) ? "default" : "outline"}
                  className="cursor-pointer flex items-center gap-2"
                  onClick={() => handleStoreToggle(store)}
                >
                  {storeLogos[store] && (
                    <img src={storeLogos[store]} alt={store} className="w-4 h-4 object-contain" />
                  )}
                  {store}
                  {selectedStores.includes(store) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Style Categories</h3>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategories.includes(category) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleCategoryToggle(category)}
                >
                  {category}
                  {selectedCategories.includes(category) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};