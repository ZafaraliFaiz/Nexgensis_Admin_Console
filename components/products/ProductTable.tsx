"use client";

/**
 * components/products/ProductTable.tsx
 *
 * Desktop tabular presentation for the product catalog (md+ screens).
 *
 * Capabilities:
 * 1. Rich Data Columns: Displays thumbnails, categorized titles, badges, ratings, and stock levels.
 * 2. Semantic Color Coding: Stock levels dynamically styled (Red for <10, Amber for <50, Emerald for >=50).
 * 3. Row Navigation: Entire row is clickable, directing to `/products/[id]`.
 */

import React from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types";
import { Star, ChevronRight, Package } from "lucide-react";

interface ProductTableProps {
  products: Product[];
}

/**
 * Returns Tailwind class names and label based on product stock thresholds.
 */
export function getStockBadgeConfig(stock: number): {
  className: string;
  label: string;
  dotColor: string;
} {
  if (stock < 10) {
    return {
      className: "bg-danger-50 text-danger-700 border-danger-200",
      dotColor: "bg-danger-500",
      label: stock === 0 ? "Out of stock" : `Critical: ${stock} left`,
    };
  }
  if (stock < 50) {
    return {
      className: "bg-warning-50 text-warning-700 border-warning-200",
      dotColor: "bg-warning-500",
      label: `${stock} in stock`,
    };
  }
  return {
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotColor: "bg-emerald-500",
    label: `${stock} in stock`,
  };
}

export default function ProductTable({ products }: ProductTableProps) {
  const router = useRouter();

  const handleRowClick = (productId: number) => {
    router.push(`/products/${productId}`);
  };

  return (
    <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 select-none">
              <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
                Inventory
              </th>
              <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                View
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => {
              const stockBadge = getStockBadgeConfig(product.stock);

              return (
                <tr
                  key={product.id}
                  onClick={() => handleRowClick(product.id)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  {/* Product Thumbnail + Title + Brand */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center relative">
                        {product.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.thumbnail}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-900 truncate group-hover:text-primary-600 transition-colors">
                          {product.title}
                        </div>
                        <div className="text-xs text-slate-500 truncate flex items-center gap-1.5">
                          {product.brand ? <span>{product.brand}</span> : <span>SKU: {product.sku || `#${product.id}`}</span>}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category Pill */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                      {(product.category || "General").replace(/-/g, " ")}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-900 font-mono">
                      ₹{(product.price ?? 0).toFixed(2)}
                    </div>
                    {product.discountPercentage && product.discountPercentage > 0 ? (
                      <div className="text-[11px] text-emerald-600 font-medium">
                        {product.discountPercentage}% off
                      </div>
                    ) : null}
                  </td>

                  {/* Star Rating */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center text-amber-500">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      </div>
                      <span className="text-sm font-semibold text-slate-800">
                        {(product.rating ?? 0).toFixed(1)}
                      </span>
                    </div>
                  </td>

                  {/* Stock Status Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${stockBadge.className}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${stockBadge.dotColor}`} />
                      {stockBadge.label}
                    </span>
                  </td>

                  {/* Action Chevron */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex p-1.5 rounded-lg text-slate-400 group-hover:text-primary-600 group-hover:bg-primary-50 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
