/**
 * components/products/ProductDetailSkeleton.tsx
 *
 * Dedicated skeleton loader specifically designed for the Product Detail Page.
 *
 * Capabilities:
 * Matches the layout geometry of the image gallery, title block, pricing & discount cards,
 * spec tables, and reviews section to eliminate Cumulative Layout Shift (CLS).
 */

import React from "react";

export default function ProductDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 1. Breadcrumb & Action bar skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-5 bg-slate-200 rounded w-48" />
        <div className="flex gap-2">
          <div className="h-9 bg-slate-200 rounded-lg w-24" />
          <div className="h-9 bg-slate-200 rounded-lg w-24" />
        </div>
      </div>

      {/* 2. Main Product Details Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Gallery Skeleton (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="aspect-square bg-slate-100 rounded-2xl border border-slate-200" />
            <div className="flex gap-2.5">
              <div className="w-16 h-16 bg-slate-100 rounded-xl border border-slate-200" />
              <div className="w-16 h-16 bg-slate-100 rounded-xl border border-slate-200" />
              <div className="w-16 h-16 bg-slate-100 rounded-xl border border-slate-200" />
            </div>
          </div>

          {/* Product Overview Skeleton (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <div className="h-5 bg-slate-200 rounded-full w-24" />
              <div className="h-8 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-100 rounded w-1/3" />
            </div>

            {/* Price block skeleton */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="h-8 bg-slate-200 rounded w-28" />
              <div className="h-6 bg-slate-200 rounded w-20" />
            </div>

            {/* Description skeleton */}
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-5/6" />
              <div className="h-4 bg-slate-200 rounded w-4/6" />
            </div>

            {/* Specs Grid Skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Customer Reviews Section Skeleton */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="h-6 bg-slate-200 rounded w-40" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-slate-200 rounded w-24" />
                <div className="h-4 bg-slate-200 rounded w-12" />
              </div>
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-3 bg-slate-100 rounded w-4/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
