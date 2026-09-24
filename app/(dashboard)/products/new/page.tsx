"use client";

/**
 * app/(dashboard)/products/new/page.tsx
 *
 * New Product Creation View.
 *
 * Capabilities & Architectural Decisions (Phase 5):
 * 1. API Call: Dispatches `POST /products/add` through `addProduct(values)` to DummyJSON.
 * 2. Session Overlay Integration:
 *    On success, records the newly created product in `ProductSessionContext`. This guarantees the
 *    product immediately surfaces at the top of the product catalog for the rest of the session.
 * 3. Feedback: Emits a toast notification explaining the local write persistence behavior.
 */

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addProduct } from "@/lib/api/products";
import { useProductSession } from "@/lib/context/ProductSessionContext";
import { ProductFormValues, ApiError } from "@/types";
import ProductForm from "@/components/products/ProductForm";
import { ArrowLeft, ChevronRight, Sparkles, PlusCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function NewProductPage() {
  const router = useRouter();
  const { recordProductAdded } = useProductSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      // 1. Call DummyJSON POST /products/add
      const createdProduct = await addProduct(values);

      // 2. Ensure all properties have robust defaults (rating, stock, price, images)
      const fullProduct = {
        ...createdProduct,
        title: values.title,
        category: values.category,
        price: Number(values.price),
        stock: Number(values.stock),
        description: values.description,
        rating: createdProduct.rating ?? 5.0,
        discountPercentage: values.discountPercentage ? Number(values.discountPercentage) : 0,
        brand: values.brand || "Custom Brand",
        images:
          createdProduct.images && createdProduct.images.length > 0
            ? createdProduct.images
            : [values.thumbnail],
        thumbnail: values.thumbnail,
        reviews: [],
        availabilityStatus: Number(values.stock) > 0 ? "In Stock" : "Out of Stock",
      };

      // 3. Persist into client session overlay
      recordProductAdded(fullProduct);

      // 4. Show clean success toast
      toast.success("Product created successfully");

      // 5. Route back to product catalog
      router.push("/products");
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(apiErr.message || "Failed to create product. Please verify your inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header & Breadcrumbs */}
      <div className="space-y-2">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link
            href="/products"
            className="hover:text-primary-600 font-medium transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Products</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-900">Add New Product</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-7 h-7 text-primary-600" />
              <span>Create New Product</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Add a new item to your enterprise catalog with verified pricing and inventory units.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white border border-slate-200 text-slate-600 shadow-sm self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Catalog Active</span>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <ProductForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitButtonText="Create Product"
        cancelHref="/products"
      />
    </div>
  );
}
