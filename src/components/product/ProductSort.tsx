import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type SortOption = "match" | "price" | "date";

interface ProductSortProps {
  sortBy: SortOption;
  onSort: (value: SortOption) => void;
}

export const ProductSort = ({ sortBy, onSort }: ProductSortProps) => {
  return (
    <div className="flex items-center justify-end mb-4">
      <Select value={sortBy} onValueChange={(value) => onSort(value as SortOption)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="match">Best Match</SelectItem>
          <SelectItem value="price">Price</SelectItem>
          <SelectItem value="date">Latest</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};