import { useState, useEffect } from "react";
import type { ProductMatch } from "@/types/product";
import type { FilterOptions } from "@/components/product/ProductFilters";

export const useProductFilters = (items: ProductMatch[]) => {
  const [filters, setFilters] = useState<FilterOptions>({
    stores: [],
    styleCategories: [],
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Get unique stores and categories from items
  const availableStores = Array.from(new Set(items.map((item) => item.store_name)));
  const availableCategories = Array.from(
    new Set(items.flatMap((item) => item.style_tags || []))
  );

  // Filter items based on current filters
  const filteredItems = items.filter((item) => {
    if (filters.minPrice && item.product_price < filters.minPrice) return false;
    if (filters.maxPrice && item.product_price > filters.maxPrice) return false;
    if (filters.stores.length && !filters.stores.includes(item.store_name)) return false;
    if (
      filters.styleCategories.length &&
      !filters.styleCategories.some((cat) => item.style_tags?.includes(cat))
    )
      return false;
    return true;
  });

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  return {
    filters,
    setFilters,
    currentPage,
    setCurrentPage,
    filteredItems,
    availableStores,
    availableCategories,
  };
};