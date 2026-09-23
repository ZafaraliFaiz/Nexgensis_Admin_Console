"use client";

/**
 * app/(dashboard)/dashboard/page.tsx
 *
 * Dashboard metrics overview page.
 */

import React from "react";
import Link from "next/link";
import { Package, ArrowRight, Activity, TrendingUp } from "lucide-react";

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Catalog health, metrics, and administration shortcuts.</p>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <span>Manage Catalog</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Products</span>
            <Package className="w-4 h-4 text-primary-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">194</div>
          <p className="text-xs text-slate-400 mt-1">Across 24 categories in DummyJSON</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">System Status</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">Operational</div>
          <p className="text-xs text-slate-400 mt-1">Authentication &amp; API Active</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Catalog Engine</span>
            <TrendingUp className="w-4 h-4 text-primary-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">v2.0</div>
          <p className="text-xs text-slate-400 mt-1">Next.js 14 App Router + Tailwind</p>
        </div>
      </div>
    </div>
  );
}
