"use client";

/**
 * app/(dashboard)/products/page.tsx
 *
 * Products management page entry for the admin dashboard.
 *
 * Capabilities in Phase 1:
 * Provides the initial authenticated workspace view with catalog status, quick stats,
 * and user greeting before Phase 2 builds out the full paginated table & card grid.
 */

import React, { useEffect, useState } from "react";
import { getAuthUser } from "@/lib/utils/authStorage";
import { User } from "@/types";
import { Package, Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ProductsPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getAuthUser());
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Phase 1 Setup Complete &bull; Authenticated Session
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.firstName || user?.username || "Admin"}
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Enterprise Product Catalog Management Console. Authentication, shared Axios client with interceptors,
            Edge middleware, and design system tokens are active.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span className="text-slate-400 block font-medium">Signed in as</span>
            <span className="font-semibold text-slate-800 font-mono">{user?.email || user?.username}</span>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary-50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">API Connection</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900">DummyJSON API v2</div>
          <p className="text-xs text-slate-500 mt-1">Single shared Axios instance with auth interceptors.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Route Protection</span>
            <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900">Edge Middleware</div>
          <p className="text-xs text-slate-500 mt-1">Guards /products, /dashboard, and redirects /.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Next Phase</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900">Phase 2: Product List</div>
          <p className="text-xs text-slate-500 mt-1">Paginated desktop table, mobile cards, and page size controls.</p>
        </div>
      </div>
    </div>
  );
}
