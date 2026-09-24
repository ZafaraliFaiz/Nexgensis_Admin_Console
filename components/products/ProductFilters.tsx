"use client";

/**
 * components/products/ProductFilters.tsx
 *
 * Unified filter, search, and sort toolbar for the product catalog.
 *
 * Capabilities & Architectural Decisions:
 * 1. Debounced Search Input: Instant local keystroke response with debounced URL/API sync.
 * 2. Race-Condition Feedback: Inline spinner indicates when a search query is actively in-flight.
 * 3. DummyJSON API Conflict Handling:
 *    - API Limitation: DummyJSON cannot execute GET /products/search and GET /products/category simultaneously.
 *    - UX Decision: Searching takes priority. When `q` is active, the category dropdown is disabled
 *      with an informative tooltip and badge. Clearing search immediately re-enables category filtering.
 * 4. Sort Control: Combined field + direction selector (Price, Rating, Title) syncing ?sortBy=&order=.
 * 5. Quick Reset: "Clear Filters" action whenever non-default query params are active.
 */

import React, { useState, useEffect } from "react";
import {
  Search,
  X,
  Loader2,
  Filter,
  ArrowUpDown,
  RotateCcw,
  Info,
  Layers,
} from "lucide-react";
import { CategoryItem, SortField, SortOrder } from "@/types";

interface ProductFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSearching: boolean;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: CategoryItem[];
  isCategoriesLoading: boolean;
  sortBy: SortField | "";
  order: SortOrder | "";
  onSortChange: (sortBy: SortField | "", order: SortOrder | "") => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
}

export default function ProductFilters({
  searchQuery,
  onSearchChange,
  isSearching,
  selectedCategory,
  onCategoryChange,
  categories,
  isCategoriesLoading,
  sortBy,
  order,
  onSortChange,
  onClearAll,
  hasActiveFilters,
}: ProductFiltersProps) {
  // Local search input value for immediate typing response
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Sync external search query (e.g. on URL change or clear all) with local input state
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Debounce user input: emit onSearchChange 400ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        onSearchChange(localSearch);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, onSearchChange]);

  const handleClearSearch = () => {
    setLocalSearch("");
    onSearchChange("");
  };

  // Compose current sort value string for the select element
  const currentSortValue = sortBy && order ? `${sortBy}-${order}` : "";

  const handleSortSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) {
      onSortChange("", "");
      return;
    }

    const [newSortBy, newOrder] = value.split("-") as [SortField, SortOrder];
    onSortChange(newSortBy, newOrder);
  };

  const isCategoryDisabled = Boolean(searchQuery.trim());

  return (
    <div className="space-y-3">
      {/* Main Filter Bar Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* 1. Search Box (Takes 5 cols on lg) */}
          <div className="lg:col-span-5 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </div>
            <input
              type="text"
              id="product-search-input"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search products by title or description..."
              className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:bg-white transition-colors"
            />
            {localSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 2. Category Filter Dropdown (Takes 4 cols on lg) */}
          <div className="lg:col-span-4 relative">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Filter className="w-3.5 h-3.5" />
              </div>
              <select
                id="product-category-select"
                value={selectedCategory}
                disabled={isCategoryDisabled || isCategoriesLoading}
                onChange={(e) => onCategoryChange(e.target.value)}
                className={`w-full pl-9 pr-8 py-2 border rounded-lg text-xs font-medium appearance-none transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-600 ${
                  isCategoryDisabled
                    ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-75"
                    : selectedCategory
                    ? "bg-primary-50/50 border-primary-300 text-primary-900 font-semibold"
                    : "bg-slate-50 border-slate-300 text-slate-700 focus:bg-white"
                }`}
                title={
                  isCategoryDisabled
                    ? "Category filter is disabled while search is active (DummyJSON API limitation)"
                    : undefined
                }
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Sort Dropdown (Takes 3 cols on lg) */}
          <div className="lg:col-span-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <ArrowUpDown className="w-3.5 h-3.5" />
              </div>
              <select
                id="product-sort-select"
                value={currentSortValue}
                onChange={handleSortSelectChange}
                className={`w-full pl-9 pr-8 py-2 border rounded-lg text-xs font-medium appearance-none transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-600 ${
                  currentSortValue
                    ? "bg-primary-50/50 border-primary-300 text-primary-900 font-semibold"
                    : "bg-slate-50 border-slate-300 text-slate-700 focus:bg-white"
                }`}
              >
                <option value="">Sort: Featured / Default</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating-desc">Rating: Highest First</option>
                <option value="rating-asc">Rating: Lowest First</option>
                <option value="title-asc">Title: A to Z</option>
                <option value="title-desc">Title: Z to A</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filters & Reset Strip */}
        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 font-medium">Active Filters:</span>

              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                  <Search className="w-3 h-3 text-slate-500" />
                  <span>Query: <strong>&ldquo;{searchQuery}&rdquo;</strong></span>
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="text-slate-400 hover:text-slate-700 ml-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedCategory && !isCategoryDisabled && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 capitalize">
                  <Layers className="w-3 h-3 text-slate-500" />
                  <span>Category: <strong>{selectedCategory.replace(/-/g, " ")}</strong></span>
                  <button
                    type="button"
                    onClick={() => onCategoryChange("")}
                    className="text-slate-400 hover:text-slate-700 ml-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {sortBy && order && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  <span>Sort: <strong className="capitalize">{sortBy} ({order.toUpperCase()})</strong></span>
                  <button
                    type="button"
                    onClick={() => onSortChange("", "")}
                    className="text-slate-400 hover:text-slate-700 ml-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            <button
              type="button"
              id="clear-all-filters-button"
              onClick={onClearAll}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-danger-600 transition-colors cursor-pointer font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All</span>
            </button>
          </div>
        )}
      </div>

      {/* API Limitation Notice: Rendered when user is actively searching */}
      {isCategoryDisabled && (
        <div className="px-4 py-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-center gap-2.5 text-xs text-amber-800 animate-in fade-in duration-200">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>API Limitation:</strong> DummyJSON does not support simultaneous keyword search and category filtering. Category filter is paused while search query is active.
          </span>
        </div>
      )}
    </div>
  );
}
