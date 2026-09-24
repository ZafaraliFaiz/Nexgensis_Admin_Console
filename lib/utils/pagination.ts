/**
 * lib/utils/pagination.ts
 *
 * Utility functions for manual pagination arithmetic, URL query parameter parsing,
 * input sanitization, and page range generation.
 *
 * Why this file exists:
 * 1. Centralizes defensive URL parameter validation so components don't duplicate `parseInt` or bounds logic.
 * 2. Provides deterministic pagination window algorithms (e.g. `1 2 3 ... 10`) without third-party libraries.
 * 3. Keeps presentation calculations (e.g. "Showing 21–40 of 194") pure and fully testable.
 */

export const ALLOWED_PAGE_SIZES: number[] = [10, 20, 50];
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE = 1;

/**
 * Parses and sanitizes a raw string page parameter from the URL.
 * Guards against null, undefined, non-numeric strings, negative numbers, and zero.
 *
 * @param value - Raw query string value (e.g. searchParams.get('page'))
 * @param defaultPage - Fallback page number if invalid (defaults to 1)
 * @returns Sanitized positive integer (>= 1)
 */
export function parsePageParam(
  value: string | null | undefined,
  defaultPage: number = DEFAULT_PAGE
): number {
  if (!value) return defaultPage;

  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < 1) {
    return defaultPage;
  }

  return parsed;
}

/**
 * Parses and sanitizes the page size parameter from the URL.
 * Ensures the value strictly matches one of the allowed page sizes (10, 20, 50).
 *
 * @param value - Raw query string value (e.g. searchParams.get('pageSize'))
 * @param allowedSizes - Array of valid page size integers
 * @param defaultSize - Fallback size if value is not in allowed list
 * @returns Valid page size integer
 */
export function parsePageSizeParam(
  value: string | null | undefined,
  allowedSizes: number[] = ALLOWED_PAGE_SIZES,
  defaultSize: number = DEFAULT_PAGE_SIZE
): number {
  if (!value) return defaultSize;

  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || !allowedSizes.includes(parsed)) {
    return defaultSize;
  }

  return parsed;
}

/**
 * Clamps a page number within valid bounds [1, totalPages].
 *
 * @param page - Target page number
 * @param total - Total count of records
 * @param pageSize - Number of records per page
 * @returns Clamped page number
 */
export function clampPage(page: number, total: number, pageSize: number): number {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (page < 1) return 1;
  if (page > totalPages) return totalPages;
  return page;
}

/**
 * Calculates human-readable summary metrics: "Showing X–Y of Z".
 *
 * @param currentPage - Active 1-indexed page
 * @param pageSize - Items per page
 * @param total - Total records count
 * @returns Object with start, end, total, and formatted text string
 */
export function calculatePaginationSummary(
  currentPage: number,
  pageSize: number,
  total: number
): {
  start: number;
  end: number;
  total: number;
  text: string;
} {
  if (total === 0) {
    return {
      start: 0,
      end: 0,
      total: 0,
      text: "Showing 0 of 0 products",
    };
  }

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);

  return {
    start,
    end,
    total,
    text: `Showing ${start}–${end} of ${total}`,
  };
}

/**
 * Generates an array of page numbers and ellipsis tokens for rendering pagination controls.
 * Produces sensible windows like [1, 2, 3, 4, 5, 'ellipsis', 10] or [1, 'ellipsis', 4, 5, 6, 'ellipsis', 10].
 *
 * @param currentPage - Current active page number
 * @param totalPages - Total available pages
 * @param siblingCount - Number of page buttons to show adjacent to current page (default: 1)
 * @returns Array containing page numbers and "ellipsis" strings
 */
export function generatePaginationRange(
  currentPage: number,
  totalPages: number,
  siblingCount: number = 1
): (number | "ellipsis")[] {
  // If total pages is small (<= 7), show all page numbers directly
  const totalNumbersToShow = siblingCount * 2 + 5; // 1 + siblings + current + siblings + last + 2 ellipses

  if (totalPages <= totalNumbersToShow) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftEllipsis = leftSiblingIndex > 2;
  const shouldShowRightEllipsis = rightSiblingIndex < totalPages - 1;

  // Case 1: No left ellipsis, but show right ellipsis (e.g. [1, 2, 3, 4, 5, 'ellipsis', 10])
  if (!shouldShowLeftEllipsis && shouldShowRightEllipsis) {
    const leftItemCount = 3 + 2 * siblingCount;
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, "ellipsis", totalPages];
  }

  // Case 2: Show left ellipsis, but no right ellipsis (e.g. [1, 'ellipsis', 6, 7, 8, 9, 10])
  if (shouldShowLeftEllipsis && !shouldShowRightEllipsis) {
    const rightItemCount = 3 + 2 * siblingCount;
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + i + 1
    );
    return [1, "ellipsis", ...rightRange];
  }

  // Case 3: Show both left and right ellipses (e.g. [1, 'ellipsis', 4, 5, 6, 'ellipsis', 10])
  if (shouldShowLeftEllipsis && shouldShowRightEllipsis) {
    const middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i
    );
    return [1, "ellipsis", ...middleRange, "ellipsis", totalPages];
  }

  return Array.from({ length: totalPages }, (_, i) => i + 1);
}

/**
 * Parses and sanitizes the sort field parameter from the URL.
 */
export function parseSortByParam(value: string | null | undefined): "price" | "rating" | "title" | "" {
  if (value === "price" || value === "rating" || value === "title") {
    return value;
  }
  return "";
}

/**
 * Parses and sanitizes the sort order direction from the URL.
 */
export function parseSortOrderParam(value: string | null | undefined): "asc" | "desc" | "" {
  if (value === "asc" || value === "desc") {
    return value;
  }
  return "";
}

/**
 * Sanitizes category query strings from the URL.
 */
export function parseCategoryParam(value: string | null | undefined): string {
  if (!value) return "";
  return value.trim();
}

/**
 * Sanitizes keyword search query strings from the URL.
 */
export function parseSearchParam(value: string | null | undefined): string {
  if (!value) return "";
  return value.trim();
}

