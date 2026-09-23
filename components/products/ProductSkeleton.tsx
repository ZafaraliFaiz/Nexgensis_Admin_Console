/**
 * components/products/ProductSkeleton.tsx
 *
 * Skeleton loader representing the exact geometry of the Product Table (desktop)
 * and Product Card List (mobile) during async data fetching.
 *
 * Why this component exists:
 * Prevents Layout Shift (CLS) by mirroring table column widths, pill dimensions,
 * and mobile card containers using Tailwind's `animate-pulse` utility.
 */

import React from "react";

interface ProductSkeletonProps {
  count?: number;
}

export default function ProductSkeleton({ count = 10 }: ProductSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <div className="w-full">
      {/* Desktop Table Skeleton (md+) */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75">
              <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-80">
                Product
              </th>
              <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Category
              </th>
              <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Price
              </th>
              <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Rating
              </th>
              <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Stock Status
              </th>
              <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((i) => (
              <tr key={i} className="animate-pulse">
                {/* Product Column */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-slate-200 shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                    </div>
                  </div>
                </td>
                {/* Category Column */}
                <td className="py-3.5 px-4">
                  <div className="h-5 bg-slate-200 rounded-full w-20" />
                </td>
                {/* Price Column */}
                <td className="py-3.5 px-4">
                  <div className="h-4 bg-slate-200 rounded w-14 font-semibold" />
                </td>
                {/* Rating Column */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-slate-200" />
                    <div className="h-4 bg-slate-200 rounded w-8" />
                  </div>
                </td>
                {/* Stock Column */}
                <td className="py-3.5 px-4">
                  <div className="h-5 bg-slate-200 rounded-full w-24" />
                </td>
                {/* Action Column */}
                <td className="py-3.5 px-4 text-right">
                  <div className="w-6 h-6 bg-slate-200 rounded-md ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List Skeleton (<md) */}
      <div className="md:hidden space-y-3">
        {items.map((i) => (
          <div
            key={i}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm animate-pulse space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 bg-slate-200 rounded-full w-20" />
              <div className="h-5 bg-slate-200 rounded-full w-16" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 bg-slate-200 rounded w-5/6" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="h-5 bg-slate-200 rounded w-16" />
              <div className="h-4 bg-slate-200 rounded w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
