import { Store, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SupportedStore } from "@/types/store";

interface SupportedStoreListProps {
  stores: SupportedStore[];
  selectedStores: string[];
  onStoreSelect: (storeId: string, storeName: string) => Promise<void>;
  isProcessing: boolean;
}

export const SupportedStoreList = ({
  stores,
  selectedStores,
  onStoreSelect,
  isProcessing,
}: SupportedStoreListProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {stores?.map((store) => (
        <Button
          key={store.id}
          variant={selectedStores.includes(store.id) ? "default" : "outline"}
          className="h-auto py-6 px-4 flex flex-col items-center gap-4 relative group animate-fade-in"
          onClick={() => onStoreSelect(store.id, store.name)}
          disabled={isProcessing}
        >
          {selectedStores.includes(store.id) && (
            <div className="absolute top-2 right-2 flex items-center gap-1">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Connected</span>
            </div>
          )}
          {store.logo_url ? (
            <img
              src={store.logo_url}
              alt={store.name}
              className="w-12 h-12 object-contain rounded-full bg-background shadow-sm"
            />
          ) : (
            <Store className="w-12 h-12 text-primary" />
          )}
          <span className="text-lg font-medium">{store.name}</span>
          <span className="text-sm text-muted-foreground">
            {store.is_official ? "Official API" : "Web Scraping"}
          </span>
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none" />
        </Button>
      ))}
    </div>
  );
};