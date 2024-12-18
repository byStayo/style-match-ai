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
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {stores?.map((store) => (
        <Button
          key={store.id}
          variant={selectedStores.includes(store.id) ? "default" : "outline"}
          className="h-auto py-4 px-3 flex flex-col items-center gap-2 relative group animate-fade-in touch-manipulation"
          onClick={() => onStoreSelect(store.id, store.name)}
          disabled={isProcessing}
        >
          {selectedStores.includes(store.id) && (
            <div className="absolute top-2 right-2 flex items-center gap-1">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground hidden sm:inline">Connected</span>
            </div>
          )}
          {store.logo_url ? (
            <img
              src={store.logo_url}
              alt={store.name}
              className="w-10 h-10 object-contain rounded-full bg-background shadow-sm"
              loading="lazy"
            />
          ) : (
            <Store className="w-10 h-10 text-primary" />
          )}
          <span className="text-base font-medium text-center line-clamp-1">{store.name}</span>
          <span className="text-xs text-muted-foreground text-center hidden sm:block">
            {store.is_official ? "Official API" : "Web Scraping"}
          </span>
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none" />
        </Button>
      ))}
    </div>
  );
};