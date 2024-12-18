import { Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface StoreFilterProps {
  availableStores: string[];
  selectedStores: string[];
  storeLogos: Record<string, string>;
  onStoreToggle: (store: string) => void;
}

export const StoreFilter = ({
  availableStores,
  selectedStores,
  storeLogos,
  onStoreToggle,
}: StoreFilterProps) => {
  return (
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
            onClick={() => onStoreToggle(store)}
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
  );
};