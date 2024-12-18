import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, Sparkles, Percent } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { StoreFilter } from "./filters/StoreFilter";
import { StyleCategoryFilter } from "./filters/StyleCategoryFilter";
import { PriceRangeFilter } from "./filters/PriceRangeFilter";

export interface FilterOptions {
  stores: string[];
  styleCategories: string[];
  minPrice?: number;
  maxPrice?: number;
  minMatchScore?: number;
  onlyHighConfidence?: boolean;
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
  const [matchScoreThreshold, setMatchScoreThreshold] = useState<number>(70);
  const [onlyHighConfidence, setOnlyHighConfidence] = useState(false);
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
    updateFilters(newStores, selectedCategories, priceRange, matchScoreThreshold, onlyHighConfidence);
  };

  const handleCategoryToggle = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    setSelectedCategories(newCategories);
    updateFilters(selectedStores, newCategories, priceRange, matchScoreThreshold, onlyHighConfidence);
  };

  const handlePriceChange = (value: [number, number]) => {
    setPriceRange(value);
    updateFilters(selectedStores, selectedCategories, value, matchScoreThreshold, onlyHighConfidence);
  };

  const handleMatchScoreChange = (value: number[]) => {
    setMatchScoreThreshold(value[0]);
    updateFilters(selectedStores, selectedCategories, priceRange, value[0], onlyHighConfidence);
  };

  const updateFilters = (
    stores: string[],
    categories: string[],
    [min, max]: [number, number],
    matchScore: number,
    highConfidence: boolean
  ) => {
    onFilterChange({
      stores,
      styleCategories: categories,
      minPrice: min,
      maxPrice: max,
      minMatchScore: matchScore,
      onlyHighConfidence: highConfidence,
    });
  };

  const clearFilters = () => {
    setSelectedStores([]);
    setSelectedCategories([]);
    setPriceRange([0, 1000]);
    setMatchScoreThreshold(70);
    setOnlyHighConfidence(false);
    onFilterChange({
      stores: [],
      styleCategories: [],
      minMatchScore: 70,
      onlyHighConfidence: false,
    });
  };

  const activeFilterCount =
    selectedStores.length + 
    selectedCategories.length + 
    (priceRange[0] > 0 || priceRange[1] < 1000 ? 1 : 0) +
    (matchScoreThreshold > 70 ? 1 : 0) +
    (onlyHighConfidence ? 1 : 0);

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
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Percent className="w-4 h-4" />
                Match Score
              </h3>
              <span className="text-sm text-muted-foreground">{matchScoreThreshold}%+</span>
            </div>
            <Slider
              min={0}
              max={100}
              step={5}
              value={[matchScoreThreshold]}
              onValueChange={handleMatchScoreChange}
              className="w-full"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <Label htmlFor="high-confidence">High Confidence Only</Label>
              </div>
              <Switch
                id="high-confidence"
                checked={onlyHighConfidence}
                onCheckedChange={(checked) => {
                  setOnlyHighConfidence(checked);
                  updateFilters(selectedStores, selectedCategories, priceRange, matchScoreThreshold, checked);
                }}
              />
            </div>
          </div>

          <StoreFilter
            availableStores={availableStores}
            selectedStores={selectedStores}
            storeLogos={storeLogos}
            onStoreToggle={handleStoreToggle}
          />

          <StyleCategoryFilter
            availableCategories={availableCategories}
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
          />

          <PriceRangeFilter
            priceRange={priceRange}
            onPriceChange={handlePriceChange}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};