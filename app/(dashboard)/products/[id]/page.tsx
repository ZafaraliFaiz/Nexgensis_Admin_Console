"use client";

/**
 * app/(dashboard)/products/[id]/page.tsx
 *
 * Product Detail placeholder view for Phase 2.
 *
 * Capabilities:
 * 1. Safe Routing: Prevents 404 when clicking product rows/cards in the product list.
 * 2. Breadcrumb Navigation: Back navigation link back to `/products`.
 * 3. Prepares foundation for Phase 4's full gallery, reviews, and interactive states.
 */

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { getProductById } from "@/lib/api/products";
import { Product, ApiError } from "@/types";
import { ArrowLeft, Star, Package, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import ErrorState from "@/components/common/ErrorState";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProductById(productId);
      setProduct(data);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [productId]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-32" />
        <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-64 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-6">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </Link>
        <ErrorState error={error} onRetry={fetchDetail} title="Product Not Found" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Product Catalog</span>
        </Link>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div className="aspect-square bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center">
            {product.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.thumbnail}
                alt={product.title}
                className="w-full h-full object-contain p-4"
              />
            ) : (
              <Package className="w-16 h-16 text-slate-300" />
            )}
          </div>

          {/* Product Meta */}
          <div className="space-y-5">
            <div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200 capitalize mb-2">
                {product.category.replace(/-/g, " ")}
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {product.title}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Brand: <strong className="text-slate-700">{product.brand || "Generic"}</strong> &bull; SKU: {product.sku || `#${product.id}`}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-3xl font-extrabold text-slate-900 font-mono">
                ${product.price.toFixed(2)}
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-semibold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{product.rating.toFixed(1)} / 5.0</span>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              {product.description}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-slate-400" />
                <span>{product.shippingInformation || "Standard shipping"}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span>{product.warrantyInformation || "1 Year Warranty"}</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-slate-400" />
                <span>{product.returnPolicy || "30-day returns"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-400" />
                <span>{product.stock} units in inventory</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
