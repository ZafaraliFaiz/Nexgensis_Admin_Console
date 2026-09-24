"use client";

/**
 * app/(dashboard)/products/page.tsx
 *
 * Primary Product Catalog management view for the admin dashboard.
 *
 * Capabilities & Architectural Decisions (Phases 1-5):
 * 1. Unified URL-Synced State:
 *    - All 5 query dimensions (?page=&pageSize=&q=&category=&sortBy=&order=) coexist cleanly in the URL.
 *    - Direct URL access or sharing reproduces the exact state, filter set, and pagination slice.
 * 2. Race-Condition Guarding:
 *    - Employs an `AbortController` alongside an incrementing request ID reference (`requestIdRef`)
 *      so that if rapid keystrokes trigger multiple queries, only the most recent request applies
 *      to component state, discarding any stale responses that resolve out-of-order.
 * 3. DummyJSON API Limitation Handling:
 *    - DummyJSON cannot perform category filtering and keyword search concurrently.
 *    - UX Rule: Searching takes precedence; when `q` is non-empty, the category filter is disabled
 *      with an explanatory notice. Clearing search re-enables category filtering immediately.
 * 4. Client-Side Session Persistence Overlay:
 *    - Applies `ProductSessionContext` mutations (session-added products, edited field overrides,
 *      and deleted IDs) on top of raw DummyJSON responses so mutations persist seamlessly.
 * 5. Multi-Tier Feedback: Loading skeletons, empty states with contextual messaging, and error retry cards.
 */

import React, { useEffect, useState, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  getProducts,
  searchProducts,
  getProductsByCategory,
  getCategories,
} from "@/lib/api/products";
import { useProductSession } from "@/lib/context/ProductSessionContext";
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
import { Package, Sparkles, Plus } from "lucide-react";

function ProductsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Session overlay context
  const { applySessionOverlay } = useProductSession();

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
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<number>(0);

  // Load category list once on mount
  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      setIsCategoriesLoading(true);
      try {
        const list = await getCategories();
        if (isMounted) setCategories(list);
      } catch {
        // Fallback gracefully on category load failure
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

      // Query resolution according to API priority rules
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

      // Guard against out-of-order race conditions
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      // Apply client-side session write overlay (combines adds, edits, and deletions)
      const overlaid = applySessionOverlay(result.products, result.total, {
        category: urlCategory,
        query: urlQuery,
      });

      setProducts(overlaid.products);
      setTotal(overlaid.total);

      // Bounds Clamping: Normalize ?page if greater than actual total pages
      const validMaxPage = Math.max(1, Math.ceil(overlaid.total / urlPageSize));
      if (urlPage > validMaxPage && overlaid.total > 0) {
        updateUrlParams({ page: validMaxPage });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "CanceledError") {
        return;
      }
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      const apiErr = err as ApiError;
      setError(apiErr);
      toast.error(apiErr.message || "Failed to load products. Please check your connection.");
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
        setIsSearching(false);
      }
    }
  }, [urlPage, urlPageSize, urlQuery, urlCategory, urlSortBy, urlOrder, applySessionOverlay, updateUrlParams]);

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

        {/* Action Controls: Live Status + Add Product Button */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white border border-slate-200 text-slate-600 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-primary-600" />
            <span>Live Catalog Feed</span>
          </div>

          <Link
            href="/products/new"
            id="add-product-button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs font-semibold rounded-lg shadow-sm shadow-primary-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
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
