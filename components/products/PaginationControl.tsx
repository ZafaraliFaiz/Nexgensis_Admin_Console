"use client";

/**
 * components/products/PaginationControl.tsx
 *
 * Hand-crafted pagination component without external table libraries.
 *
 * Capabilities:
 * 1. Summary Metrics: Formats exact record ranges ("Showing 21–40 of 194").
 * 2. Page Size Switcher: Supports 10, 20, and 50 records per page.
 * 3. Smart Range Window: Truncates large page ranges with ellipsis markers.
 * 4. Boundary Protection: Disables Previous on page 1 and Next on totalPages.
 */

import React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import {
  ALLOWED_PAGE_SIZES,
  calculatePaginationSummary,
  generatePaginationRange,
} from "@/lib/utils/pagination";

interface PaginationControlProps {
  currentPage: number;
  pageSize: number;
  total: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
  isLoading?: boolean;
}

export default function PaginationControl({
  currentPage,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
}: PaginationControlProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const summary = calculatePaginationSummary(currentPage, pageSize, total);
  const paginationRange = generatePaginationRange(currentPage, totalPages);

  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4 select-none">
      {/* Left: Summary text + Page Size Selector */}
      <div className="flex flex-wrap items-center justify-between sm:justify-start gap-4 w-full lg:w-auto text-xs text-slate-600">
        <span className="font-medium text-slate-700">{summary.text}</span>

        <div className="flex items-center gap-2">
          <label htmlFor="pageSizeSelect" className="text-slate-500 font-medium">
            Per page:
          </label>
          <select
            id="pageSizeSelect"
            value={pageSize}
            disabled={isLoading}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-600 focus:bg-white transition-colors cursor-pointer"
          >
            {ALLOWED_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Previous / Numbers / Next Navigation */}
      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
        {/* Previous Button */}
        <button
          type="button"
          id="pagination-prev-button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirstPage || isLoading}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label="Go to previous page"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Numbered Page Buttons & Ellipses */}
        <div className="flex items-center gap-1">
          {paginationRange.map((pageItem, index) => {
            if (pageItem === "ellipsis") {
              return (
                <div
                  key={`ellipsis-${index}`}
                  className="w-8 h-8 flex items-center justify-center text-slate-400"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </div>
              );
            }

            const pageNumber = pageItem as number;
            const isCurrent = pageNumber === currentPage;

            return (
              <button
                key={pageNumber}
                type="button"
                onClick={() => onPageChange(pageNumber)}
                disabled={isLoading}
                aria-current={isCurrent ? "page" : undefined}
                className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-primary-600 text-white shadow-sm shadow-primary-600/30"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          id="pagination-next-button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLastPage || isLoading}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label="Go to next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
