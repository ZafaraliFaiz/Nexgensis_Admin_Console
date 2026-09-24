/**
 * app/(dashboard)/products/[id]/not-found.tsx
 *
 * Dedicated 404 Not Found screen for non-existent product IDs.
 *
 * Why this file exists:
 * Prevents raw exceptions or blank pages when visitors navigate to invalid product routes
 * like /products/99999 or non-numeric paths, presenting a clear recovery button back to catalog.
 */

import React from "react";
import Link from "next/link";
import { PackageX, ArrowLeft, Home } from "lucide-react";

export default function ProductNotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      {/* Icon Badge */}
      <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mb-5 shadow-sm">
        <PackageX className="w-8 h-8 text-slate-500" />
      </div>

      {/* Title & Description */}
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-danger-50 text-danger-700 border border-danger-200 mb-3">
        404 Not Found
      </span>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-2">
        Product Not Found
      </h1>

      <p className="text-sm text-slate-500 max-w-md mb-8">
        The requested product record does not exist in the DummyJSON catalog or may have been removed.
      </p>

      {/* Navigation recovery options */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs font-semibold rounded-lg shadow-sm shadow-primary-600/30 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Product Catalog</span>
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Home className="w-4 h-4 text-slate-400" />
          <span>Dashboard Overview</span>
        </Link>
      </div>
    </div>
  );
}
