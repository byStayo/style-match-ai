import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export interface FilterOptions {
  minPrice?: number;
  maxPrice?: number;
  stores: string[];
  styleCategories: string[];
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
  const [filters, setFilters] = useState<FilterOptions>({
    stores: [],
    styleCategories: [],
  });

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filter Matches</SheetTitle>
          <SheetDescription>
            Customize your style matches by applying filters
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-4">
            <Label>Price Range</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Min"
                className="w-24"
                onChange={(e) =>
                  handleFilterChange({ minPrice: Number(e.target.value) || undefined })
                }
              />
              <span>to</span>
              <Input
                type="number"
                placeholder="Max"
                className="w-24"
                onChange={(e) =>
                  handleFilterChange({ maxPrice: Number(e.target.value) || undefined })
                }
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Stores</Label>
            <div className="flex flex-wrap gap-2">
              {availableStores.map((store) => (
                <Button
                  key={store}
                  variant={filters.stores.includes(store) ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    handleFilterChange({
                      stores: filters.stores.includes(store)
                        ? filters.stores.filter((s) => s !== store)
                        : [...filters.stores, store],
                    })
                  }
                >
                  {store}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Label>Style Categories</Label>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((category) => (
                <Button
                  key={category}
                  variant={filters.styleCategories.includes(category) ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    handleFilterChange({
                      styleCategories: filters.styleCategories.includes(category)
                        ? filters.styleCategories.filter((c) => c !== category)
                        : [...filters.styleCategories, category],
                    })
                  }
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};