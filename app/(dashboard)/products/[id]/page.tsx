"use client";

/**
 * app/(dashboard)/products/[id]/page.tsx
 *
 * Full Product Detail view for the admin dashboard.
 *
 * Capabilities & Architectural Decisions (Phases 1-5):
 * 1. Deep Product Inspection: Displays image gallery, brand details, stock thresholds, pricing with discount calculation,
 *    physical dimensions, return policies, shipping times, warranty details, and verified customer reviews.
 * 2. Session Overlay & Local Write Durability:
 *    Inspects `ProductSessionContext` to display locally modified or created products seamlessly.
 * 3. Delete Flow with Custom Modal:
 *    Wired up to `DeleteConfirmModal` and `deleteProduct(id)`. Deletion removes the product from the session overlay,
 *    emits an informative success toast, and redirects to `/products`.
 * 4. Edit Navigation: Routes to `/products/[id]/edit` with pre-filled form fields.
 */

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getProductById, deleteProduct } from "@/lib/api/products";
import { useProductSession } from "@/lib/context/ProductSessionContext";
import { Product, ApiError } from "@/types";
import { getStockBadgeConfig } from "@/components/products/ProductTable";
import ProductGallery from "@/components/products/ProductGallery";
import ProductReviews from "@/components/products/ProductReviews";
import ProductDetailSkeleton from "@/components/products/ProductDetailSkeleton";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";
import {
  ArrowLeft,
  ChevronRight,
  Star,
  Package,
  ShieldCheck,
  Truck,
  RotateCcw,
  Scale,
  Maximize2,
  Barcode,
  Pencil,
  Trash2,
  PackageX,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const { getSessionProduct, recordProductDeleted } = useProductSession();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProduct = async () => {
    setIsLoading(true);
    setError(null);
    setIsNotFound(false);

    // 1. Check session overlay first
    const sessionItem = getSessionProduct(productId);
    if (sessionItem === "DELETED") {
      setIsNotFound(true);
      setIsLoading(false);
      return;
    }

    if (sessionItem) {
      setProduct(sessionItem);
      setIsLoading(false);
      return;
    }

    // 2. Fetch from DummyJSON API
    try {
      const data = await getProductById(productId);
      setProduct(data);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 404 || apiErr.message?.toLowerCase().includes("not found")) {
        setIsNotFound(true);
      } else {
        setError(apiErr);
        toast.error(apiErr.message || "Failed to load product details.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [productId, getSessionProduct]);

  // Handle product deletion
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      // 1. Attempt DELETE /products/:id
      try {
        await deleteProduct(productId);
      } catch (apiErr) {
        // Handled gracefully for locally recorded items
      }

      // 2. Record deletion in session overlay
      recordProductDeleted(productId);

      // 3. Show clean success toast
      toast.success("Product deleted successfully");

      // 4. Close modal and navigate back to product list
      setIsDeleteModalOpen(false);
      router.push("/products");
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(apiErr.message || "Failed to delete product.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Loading State
  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  // 404 Not Found State
  if (isNotFound) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 bg-white border border-slate-200 rounded-2xl p-12 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-danger-50 border border-danger-100 text-danger-600 flex items-center justify-center mb-4 shadow-sm">
          <PackageX className="w-8 h-8 text-danger-600" />
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-danger-50 text-danger-700 border border-danger-200 mb-2">
          404 Not Found
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
          Product Not Found
        </h1>
        <p className="text-sm text-slate-500 max-w-md mb-6">
          The product with ID <code className="font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{productId}</code> does not exist in the catalog or was removed.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs font-semibold rounded-lg shadow-sm shadow-primary-600/30 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Product Catalog</span>
        </Link>
      </div>
    );
  }

  // General Error State
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
        <div className="p-8 bg-white border border-danger-200 rounded-2xl text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-danger-50 text-danger-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Failed to Load Product</h2>
          <p className="text-xs text-slate-500 font-mono max-w-md mx-auto">{error?.message}</p>
          <button
            type="button"
            onClick={fetchProduct}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const stockBadge = getStockBadgeConfig(product.stock);

  // Price calculations
  const hasDiscount = product.discountPercentage && product.discountPercentage > 0;
  const originalPrice = hasDiscount
    ? product.price / (1 - product.discountPercentage! / 100)
    : product.price;

  return (
    <div className="space-y-6">
      {/* 1. Header with Breadcrumbs and Wired Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link
            href="/products"
            className="hover:text-primary-600 font-medium transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Products</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-xs">
            {product.title}
          </span>
        </nav>

        {/* Action Buttons: Edit and Delete */}
        <div className="flex items-center gap-2.5">
          <Link
            href={`/products/${productId}/edit`}
            id="edit-product-button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5 text-slate-500" />
            <span>Edit Product</span>
          </Link>

          <button
            type="button"
            id="delete-product-button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-danger-200 bg-danger-50 hover:bg-danger-100 active:bg-danger-200 text-danger-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-danger-600" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* 2. Main Product Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Left: Gallery (5 cols) */}
          <div className="lg:col-span-5">
            <ProductGallery
              images={product.images || []}
              title={product.title}
              thumbnail={product.thumbnail}
            />
          </div>

          {/* Right: Metadata & Specs (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200 capitalize">
                  {product.category.replace(/-/g, " ")}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${stockBadge.className}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${stockBadge.dotColor}`} />
                  {stockBadge.label}
                </span>
                {product.availabilityStatus && (
                  <span className="text-xs text-slate-500 font-medium">
                    &bull; {product.availabilityStatus}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
                {product.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                <span>Brand: <strong className="text-slate-800 font-semibold">{product.brand || "Generic"}</strong></span>
                <span>&bull;</span>
                <span>SKU: <strong className="text-slate-800 font-mono">{product.sku || `PRD-${product.id}`}</strong></span>
              </div>
            </div>

            {/* Price & Rating Bar */}
            <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                    ₹{(product.price ?? 0).toFixed(2)}
                  </span>
                  {hasDiscount && (
                    <span className="text-sm font-medium text-slate-400 line-through font-mono">
                      ₹{originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                {hasDiscount && (
                  <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 mt-0.5">
                    Save {product.discountPercentage}% with promotional pricing
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-lg border border-slate-200 shadow-2xs">
                <div className="flex items-center text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold text-slate-900 leading-none">
                    {(product.rating ?? 0).toFixed(1)}
                  </span>
                  <span className="text-[11px] text-slate-500 block leading-tight">
                    {product.reviews?.length || 0} reviews
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Description
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Technical Specifications Grid */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Specifications &amp; Logistics
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                    <Scale className="w-3.5 h-3.5" />
                    <span>Weight</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900">
                    {product.weight ? `${product.weight} kg` : "N/A"}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Dimensions</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 font-mono">
                    {product.dimensions
                      ? `${product.dimensions.width} × ${product.dimensions.height} × ${product.dimensions.depth} cm`
                      : "Standard"}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Shipping</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    {product.shippingInformation || "Standard 3-5 days"}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Warranty</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    {product.warrantyInformation || "Standard 1 year"}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Returns</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    {product.returnPolicy || "30-day policy"}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                    <Barcode className="w-3.5 h-3.5" />
                    <span>Barcode</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 font-mono truncate">
                    {product.meta?.barcode || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Customer Reviews */}
      <ProductReviews reviews={product.reviews} />

      {/* 4. Delete Confirmation Dialog */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Product"
        itemName={product.title}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
