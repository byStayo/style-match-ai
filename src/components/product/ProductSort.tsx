import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type SortOption = "match" | "price" | "new";

interface ProductSortProps {
  sortBy: SortOption;
  onSort: (option: SortOption) => void;
}

export const ProductSort = ({ sortBy, onSort }: ProductSortProps) => {
  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Sort by {sortBy === "match" ? "Match Score" : sortBy === "price" ? "Price" : "New Arrivals"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onSort("match")}>
            Match Score
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSort("price")}>
            Price
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSort("new")}>
            New Arrivals
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};