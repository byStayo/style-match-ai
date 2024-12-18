import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownAZ, ArrowUpDown, Sparkles, DollarSign } from "lucide-react";

export type SortOption = "match" | "price-asc" | "price-desc" | "date";

interface ProductSortProps {
  sortBy: SortOption;
  onSort: (value: SortOption) => void;
}

export const ProductSort = ({ sortBy, onSort }: ProductSortProps) => {
  return (
    <div className="flex items-center justify-end gap-2">
      <span className="text-sm text-muted-foreground">Sort by:</span>
      <Select value={sortBy} onValueChange={(value) => onSort(value as SortOption)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="match" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Best Match
          </SelectItem>
          <SelectItem value="price-asc" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Price: Low to High
          </SelectItem>
          <SelectItem value="price-desc" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Price: High to Low
          </SelectItem>
          <SelectItem value="date" className="flex items-center gap-2">
            <ArrowDownAZ className="w-4 h-4" />
            Most Recent
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};