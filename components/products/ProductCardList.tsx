"use client";

/**
 * components/products/ProductCardList.tsx
 *
 * Mobile-optimized stacked card presentation for the product catalog (<md screens).
 *
 * Capabilities:
 * 1. Ergonomic Touch Targets: Full-card click area driving navigation to `/products/[id]`.
 * 2. Complete Data Parity: Displays thumbnail, stock badges, rating stars, price, and category without horizontal scrolling.
 * 3. Elevated Card Design: Enterprise SaaS card styling with clean borders and active feedback.
 */

import React from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types";
import { Star, ChevronRight, Package } from "lucide-react";
import { getStockBadgeConfig } from "./ProductTable";

interface ProductCardListProps {
  products: Product[];
}

export default function ProductCardList({ products }: ProductCardListProps) {
  const router = useRouter();

  const handleCardClick = (productId: number) => {
    router.push(`/products/${productId}`);
  };

  return (
    <div className="md:hidden space-y-3">
      {products.map((product) => {
        const stockBadge = getStockBadgeConfig(product.stock);

        return (
          <div
            key={product.id}
            onClick={() => handleCardClick(product.id)}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm active:scale-[0.99] hover:border-slate-300 transition-all cursor-pointer space-y-3"
          >
            {/* Top Row: Category and Stock Pill */}
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 capitalize border border-slate-200">
                {(product.category || "General").replace(/-/g, " ")}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${stockBadge.className}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${stockBadge.dotColor}`} />
                {stockBadge.label}
              </span>
            </div>

            {/* Middle Section: Thumbnail + Title & Brand */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                {product.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <Package className="w-6 h-6 text-slate-400" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-slate-900 line-clamp-2">
                  {product.title}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {product.brand || `SKU: ${product.sku || `#${product.id}`}`}
                </p>
              </div>
            </div>

            {/* Bottom Row: Price, Rating, and Chevron */}
            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold text-slate-900 font-mono">
                  ₹{(product.price ?? 0).toFixed(2)}
                </span>
                {product.discountPercentage && product.discountPercentage > 0 ? (
                  <span className="text-[11px] text-emerald-600 font-medium">
                    {product.discountPercentage}% off
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{(product.rating ?? 0).toFixed(1)}</span>
                </div>
                <div className="p-1 rounded bg-slate-50 text-slate-400">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
