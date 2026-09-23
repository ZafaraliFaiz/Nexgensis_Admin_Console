"use client";

/**
 * app/(dashboard)/products/page.tsx
 *
 * Primary Product Catalog management view for the admin dashboard.
 *
 * Capabilities:
 * 1. URL-Synchronized State: `page` and `pageSize` state are bound bidirectionally to query parameters (?page=1&pageSize=10).
 * 2. Responsive Presentation: Automatically switches between `ProductTable` (desktop md+) and `ProductCardList` (mobile <md).
 * 3. Input Sanitization & Bounds Clamping: Guards against non-numeric or out-of-range URL params and normalizes them safely.
 * 4. Multi-State Handling: Loading skeletons, error state with Retry, empty state, and synchronized error toasts.
 */

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getProducts } from "@/lib/api/products";
import { Product, ApiError } from "@/types";
import {
  parsePageParam,
  parsePageSizeParam,
  clampPage,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
} from "@/lib/utils/pagination";
import ProductTable from "@/components/products/ProductTable";
import ProductCardList from "@/components/products/ProductCardList";
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

  // Parse parameters from URL with safety fallbacks
  const urlPage = parsePageParam(searchParams.get("page"), DEFAULT_PAGE);
  const urlPageSize = parsePageSizeParam(searchParams.get("pageSize"), [10, 20, 50], DEFAULT_PAGE_SIZE);

  // Data & lifecycle state
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  /**
   * Updates the URL search query parameters safely.
   */
  const updateQueryParams = useCallback(
    (newPage: number, newPageSize: number) => {
      const params = new URLSearchParams(searchParams.toString());

      if (newPage === DEFAULT_PAGE) {
        params.delete("page");
      } else {
        params.set("page", String(newPage));
      }

      if (newPageSize === DEFAULT_PAGE_SIZE) {
        params.delete("pageSize");
      } else {
        params.set("pageSize", String(newPageSize));
      }

      const queryString = params.toString();
      const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(targetUrl);
    },
    [pathname, router, searchParams]
  );

  /**
   * Primary data fetching routine.
   * Calculates skip offset: (page - 1) * pageSize.
   */
  const fetchProductList = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const skip = (urlPage - 1) * urlPageSize;

    try {
      const data = await getProducts({
        limit: urlPageSize,
        skip,
      });

      setProducts(data.products);
      setTotal(data.total);

      // Bounds Clamping Guard: If user entered an out-of-range ?page in URL (e.g. ?page=999)
      const validMaxPage = Math.max(1, Math.ceil(data.total / urlPageSize));
      if (urlPage > validMaxPage && data.total > 0) {
        updateQueryParams(validMaxPage, urlPageSize);
      }
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr);
      toast.error(apiErr.message || "Failed to load products. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  }, [urlPage, urlPageSize, updateQueryParams]);

  // Re-fetch whenever URL page or pageSize changes
  useEffect(() => {
    fetchProductList();
  }, [fetchProductList]);

  /**
   * Handle pagination button clicks (Previous, Next, Numbered page).
   */
  const handlePageChange = (newPage: number) => {
    const clamped = clampPage(newPage, total, urlPageSize);
    if (clamped !== urlPage) {
      updateQueryParams(clamped, urlPageSize);
      // Smooth scroll back to top of table on page change
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  /**
   * Handle page size switcher (10, 20, 50).
   * Resets active page to 1 to prevent invalid offsets.
   */
  const handlePageSizeChange = (newPageSize: number) => {
    if (newPageSize !== urlPageSize) {
      updateQueryParams(1, newPageSize);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Products
            </h1>
            {!isLoading && !error && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                <Package className="w-3.5 h-3.5" />
                {total} Items
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Browse, inspect, and manage catalog items, inventory levels, and pricing.
          </p>
        </div>

        {/* Live status badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white border border-slate-200 text-slate-600 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-primary-600" />
            <span>DummyJSON Live Feed</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {error ? (
        <ErrorState error={error} onRetry={fetchProductList} />
      ) : isLoading ? (
        <ProductSkeleton count={urlPageSize} />
      ) : products.length === 0 ? (
        <EmptyState
          title="No products available"
          description="The product catalog returned zero results for this pagination slice."
          actionLabel="Reset to Page 1"
          onAction={() => handlePageChange(1)}
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table */}
          <ProductTable products={products} />

          {/* Mobile Card List */}
          <ProductCardList products={products} />

          {/* Pagination Controls */}
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
