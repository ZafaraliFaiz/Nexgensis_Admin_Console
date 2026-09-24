"use client";

/**
 * app/(dashboard)/products/page.tsx
 *
 * Primary Product Catalog management view for the admin dashboard.
 *
 * Capabilities & Architectural Decisions (Phases 1-3):
 * 1. Unified URL-Synced State:
 *    - All 5 query dimensions (?page=&pageSize=&q=&category=&sortBy=&order=) coexist cleanly in the URL.
 *    - Direct URL access or sharing reproduces the exact state, filter set, and pagination slice.
 * 2. Race-Condition Guarding:
 *    - Employs an `AbortController` alongside an incrementing request ID reference (`requestIdRef`)
 *      so that if rapid keystrokes trigger multiple queries, only the most recent request applies
 *      to component state, discarding any stale responses that resolve out-of-order.
 *    - Note: This behavior is testable using DummyJSON's simulated latency parameter (&delay=2000).
 * 3. DummyJSON API Limitation Handling:
 *    - DummyJSON cannot perform category filtering and keyword search concurrently.
 *    - UX Rule: Searching takes precedence; when `q` is non-empty, the category filter is disabled
 *      with an explanatory notice. Clearing search re-enables category filtering immediately.
 * 4. Multi-Tier Feedback: Loading skeletons, empty states with contextual messaging, and error retry cards.
 */

import React, { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  getProducts,
  searchProducts,
  getProductsByCategory,
  getCategories,
} from "@/lib/api/products";
import { Product, ApiError, CategoryItem, SortField, SortOrder } from "@/types";
import {
  parsePageParam,
  parsePageSizeParam,
  parseSearchParam,
  parseCategoryParam,
  parseSortByParam,
  parseSortOrderParam,
  clampPage,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
} from "@/lib/utils/pagination";
import ProductTable from "@/components/products/ProductTable";
import ProductCardList from "@/components/products/ProductCardList";
import ProductFilters from "@/components/products/ProductFilters";
import PaginationControl from "@/components/products/PaginationControl";
import ProductSkeleton from "@/components/products/ProductSkeleton";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import toast from "react-hot-toast";
import { Package, Sparkles } from "lucide-react";

function ProductsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 1. Read and sanitize all 5 URL query parameters
  const urlPage = parsePageParam(searchParams.get("page"), DEFAULT_PAGE);
  const urlPageSize = parsePageSizeParam(searchParams.get("pageSize"), [10, 20, 50], DEFAULT_PAGE_SIZE);
  const urlQuery = parseSearchParam(searchParams.get("q"));
  const urlCategory = parseCategoryParam(searchParams.get("category"));
  const urlSortBy = parseSortByParam(searchParams.get("sortBy"));
  const urlOrder = parseSortOrderParam(searchParams.get("order"));

  // 2. Data & async state
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);

  // 3. Categories taxonomy list
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState<boolean>(false);

  // 4. Concurrency & Race-Condition References
  // AbortController cancels in-flight network sockets
  const abortControllerRef = useRef<AbortController | null>(null);
  // Monotonically increasing request ID ensures only the latest response writes to state
  const requestIdRef = useRef<number>(0);

  // Load category list once on mount
  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      setIsCategoriesLoading(true);
      try {
        const list = await getCategories();
        if (isMounted) setCategories(list);
      } catch (err) {
        console.error("Failed to load catalog categories:", err);
      } finally {
        if (isMounted) setIsCategoriesLoading(false);
      }
    };
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Updates URL query parameters in a centralized, declarative manner.
   * Cleans up default/empty values so URLs remain clean.
   */
  const updateUrlParams = useCallback(
    (updates: {
      page?: number;
      pageSize?: number;
      q?: string;
      category?: string;
      sortBy?: SortField | "";
      order?: SortOrder | "";
    }) => {
      const params = new URLSearchParams(searchParams.toString());

      // Handle page
      const newPage = updates.page !== undefined ? updates.page : urlPage;
      if (newPage <= DEFAULT_PAGE) {
        params.delete("page");
      } else {
        params.set("page", String(newPage));
      }

      // Handle pageSize
      const newPageSize = updates.pageSize !== undefined ? updates.pageSize : urlPageSize;
      if (newPageSize === DEFAULT_PAGE_SIZE) {
        params.delete("pageSize");
      } else {
        params.set("pageSize", String(newPageSize));
      }

      // Handle search query
      const newQ = updates.q !== undefined ? updates.q : urlQuery;
      if (!newQ) {
        params.delete("q");
      } else {
        params.set("q", newQ);
      }

      // Handle category filter
      const newCat = updates.category !== undefined ? updates.category : urlCategory;
      if (!newCat) {
        params.delete("category");
      } else {
        params.set("category", newCat);
      }

      // Handle sort field & order
      const newSortBy = updates.sortBy !== undefined ? updates.sortBy : urlSortBy;
      const newOrder = updates.order !== undefined ? updates.order : urlOrder;

      if (!newSortBy || !newOrder) {
        params.delete("sortBy");
        params.delete("order");
      } else {
        params.set("sortBy", newSortBy);
        params.set("order", newOrder);
      }

      const queryString = params.toString();
      const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(targetUrl);
    },
    [pathname, router, searchParams, urlPage, urlPageSize, urlQuery, urlCategory, urlSortBy, urlOrder]
  );

  /**
   * Main data fetching coordinator.
   * Determines whether to call `searchProducts`, `getProductsByCategory`, or `getProducts`.
   */
  const fetchProducts = useCallback(async () => {
    // 1. Cancel previous pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 2. Increment request tracking ID
    const currentRequestId = ++requestIdRef.current;

    setIsLoading(true);
    if (urlQuery) {
      setIsSearching(true);
    }
    setError(null);

    const skip = (urlPage - 1) * urlPageSize;
    const paginationParams = {
      limit: urlPageSize,
      skip,
      sortBy: urlSortBy || undefined,
      order: urlOrder || undefined,
      signal: controller.signal,
    };

    try {
      let result;

      // DummyJSON API Conflict Rule:
      // If a search query is present, it takes precedence and searches across all products.
      // Otherwise, if a category is selected, we query that category endpoint.
      if (urlQuery) {
        result = await searchProducts({
          ...paginationParams,
          q: urlQuery,
        });
      } else if (urlCategory) {
        result = await getProductsByCategory({
          ...paginationParams,
          category: urlCategory,
        });
      } else {
        result = await getProducts(paginationParams);
      }

      // Guard against out-of-order race conditions: Ignore if a newer request has fired
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setProducts(result.products);
      setTotal(result.total);

      // Bounds Clamping: Normalize ?page if greater than actual total pages
      const validMaxPage = Math.max(1, Math.ceil(result.total / urlPageSize));
      if (urlPage > validMaxPage && result.total > 0) {
        updateUrlParams({ page: validMaxPage });
      }
    } catch (err: unknown) {
      // Ignore deliberate AbortController cancellations
      if (err instanceof Error && err.name === "CanceledError") {
        return;
      }
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      const apiErr = err as ApiError;
      setError(apiErr);
      toast.error(apiErr.message || "Failed to load products from DummyJSON.");
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
        setIsSearching(false);
      }
    }
  }, [urlPage, urlPageSize, urlQuery, urlCategory, urlSortBy, urlOrder, updateUrlParams]);

  // Re-fetch whenever URL search params change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Cleanup pending requests when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Filter actions
  const handleSearchChange = (newQ: string) => {
    updateUrlParams({ q: newQ, page: 1 });
  };

  const handleCategoryChange = (newCategory: string) => {
    updateUrlParams({ category: newCategory, page: 1 });
  };

  const handleSortChange = (newSortBy: SortField | "", newOrder: SortOrder | "") => {
    updateUrlParams({ sortBy: newSortBy, order: newOrder, page: 1 });
  };

  const handleClearAllFilters = () => {
    updateUrlParams({ q: "", category: "", sortBy: "", order: "", page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    const clamped = clampPage(newPage, total, urlPageSize);
    if (clamped !== urlPage) {
      updateUrlParams({ page: clamped });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    if (newPageSize !== urlPageSize) {
      updateUrlParams({ pageSize: newPageSize, page: 1 });
    }
  };

  const hasActiveFilters = Boolean(urlQuery || urlCategory || urlSortBy);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Products
            </h1>
            {!isLoading && !error && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                <Package className="w-3.5 h-3.5" />
                {total} {total === 1 ? "Result" : "Items"}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Search, filter, inspect, and manage product inventory and pricing.
          </p>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white border border-slate-200 text-slate-600 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-primary-600" />
            <span>DummyJSON Live Feed</span>
          </div>
        </div>
      </div>

      {/* Filter, Search & Sort Toolbar */}
      <ProductFilters
        searchQuery={urlQuery}
        onSearchChange={handleSearchChange}
        isSearching={isSearching}
        selectedCategory={urlCategory}
        onCategoryChange={handleCategoryChange}
        categories={categories}
        isCategoriesLoading={isCategoriesLoading}
        sortBy={urlSortBy}
        order={urlOrder}
        onSortChange={handleSortChange}
        onClearAll={handleClearAllFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Main Content Presentation */}
      {error ? (
        <ErrorState error={error} onRetry={fetchProducts} />
      ) : isLoading ? (
        <ProductSkeleton count={urlPageSize} />
      ) : products.length === 0 ? (
        <EmptyState
          title={urlQuery ? `No results for "${urlQuery}"` : "No products found"}
          description={
            urlQuery || urlCategory
              ? "We couldn't find any products matching your active filters. Try broadening your search or resetting filters."
              : "There are no products available in this slice of the catalog."
          }
          actionLabel={hasActiveFilters ? "Reset Filters" : "Go to Page 1"}
          onAction={hasActiveFilters ? handleClearAllFilters : () => handlePageChange(1)}
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <ProductTable products={products} />

          {/* Mobile Cards View */}
          <ProductCardList products={products} />

          {/* Manual Pagination Controls */}
          <PaginationControl
            currentPage={urlPage}
            pageSize={urlPageSize}
            total={total}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductSkeleton count={10} />}>
      <ProductsContent />
    </Suspense>
  );
}
