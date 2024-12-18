import { Tag, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StyleCategoryFilterProps {
  availableCategories: string[];
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
}

export const StyleCategoryFilter = ({
  availableCategories,
  selectedCategories,
  onCategoryToggle,
}: StyleCategoryFilterProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <Tag className="w-4 h-4" />
        Style Categories
      </h3>
      <div className="flex flex-wrap gap-2">
        {availableCategories.map((category) => (
          <Badge
            key={category}
            variant={selectedCategories.includes(category) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => onCategoryToggle(category)}
          >
            {category}
            {selectedCategories.includes(category) && (
              <X className="ml-1 h-3 w-3" />
            )}
          </Badge>
        ))}
      </div>
    </div>
  );
};