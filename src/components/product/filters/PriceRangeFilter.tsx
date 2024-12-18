import { DollarSign } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface PriceRangeFilterProps {
  priceRange: [number, number];
  onPriceChange: (value: [number, number]) => void;
}

export const PriceRangeFilter = ({
  priceRange,
  onPriceChange,
}: PriceRangeFilterProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <DollarSign className="w-4 h-4" />
        Price Range
      </h3>
      <Slider
        min={0}
        max={1000}
        step={10}
        value={[priceRange[0], priceRange[1]]}
        onValueChange={(value) => onPriceChange([value[0], value[1]])}
        className="w-full"
      />
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>${priceRange[0]}</span>
        <span>${priceRange[1]}</span>
      </div>
    </div>
  );
};