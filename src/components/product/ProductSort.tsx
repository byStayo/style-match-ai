import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SortOption = "match" | "price" | "date";

interface ProductSortProps {
  sortBy: SortOption;
  onSort: (value: SortOption) => void;
}

export const ProductSort = ({ sortBy, onSort }: ProductSortProps) => {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold">Your Style Matches</h2>
      <Select value={sortBy} onValueChange={(value) => onSort(value as SortOption)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="match">Best Match</SelectItem>
          <SelectItem value="price">Price: Low to High</SelectItem>
          <SelectItem value="date">Most Recent</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};