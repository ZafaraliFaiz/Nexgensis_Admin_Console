"use client";

/**
 * components/products/ProductForm.tsx
 *
 * Shared form component for both Product Creation (/products/new) and Updates (/products/[id]/edit).
 *
 * Capabilities:
 * 1. Strict Client Validation:
 *    - Title: Required, >= 3 characters.
 *    - Category: Required, non-empty selection.
 *    - Price: Required, positive decimal > 0.
 *    - Stock: Required, non-negative integer >= 0.
 *    - Description: Required, >= 10 characters.
 *    - Thumbnail: Required, valid HTTP/HTTPS image URL format.
 * 2. Double-Click & Rapid Submission Guard:
 *    - Combines React state (`isSubmitting`) with immediate ref locking (`isSubmittingRef.current`).
 * 3. Live Thumbnail Preview:
 *    - Renders an interactive image preview frame as the user inputs image URLs.
 */

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ProductFormValues, CategoryItem } from "@/types";
import { getCategories } from "@/lib/api/products";
import {
  Package,
  Image as ImageIcon,
  IndianRupee,
  Layers,
  FileText,
  Tag,
  Percent,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface ProductFormProps {
  initialValues?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  isSubmitting: boolean;
  submitButtonText?: string;
  cancelHref?: string;
}

interface FormErrors {
  title?: string;
  category?: string;
  price?: string;
  stock?: string;
  description?: string;
  thumbnail?: string;
  discountPercentage?: string;
}

export default function ProductForm({
  initialValues,
  onSubmit,
  isSubmitting,
  submitButtonText = "Save Product",
  cancelHref = "/products",
}: ProductFormProps) {
  const router = useRouter();

  // Form Fields State
  const [title, setTitle] = useState(initialValues?.title || "");
  const [category, setCategory] = useState(initialValues?.category || "");
  const [price, setPrice] = useState(initialValues?.price !== undefined ? String(initialValues.price) : "");
  const [stock, setStock] = useState(initialValues?.stock !== undefined ? String(initialValues.stock) : "");
  const [description, setDescription] = useState(initialValues?.description || "");
  const [thumbnail, setThumbnail] = useState(initialValues?.thumbnail || "");
  const [brand, setBrand] = useState(initialValues?.brand || "");
  const [discountPercentage, setDiscountPercentage] = useState(
    initialValues?.discountPercentage !== undefined ? String(initialValues.discountPercentage) : ""
  );

  // Validation errors & dirty state
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Categories list
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Image load preview state
  const [imagePreviewError, setImagePreviewError] = useState(false);

  // Immediate double-click guard ref
  const isSubmittingRef = useRef(false);

  // Load categories taxonomy
  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const list = await getCategories();
        if (isMounted) setCategories(list);
      } catch (err) {
        // Fallback gracefully if category taxonomy fails to load
      } finally {
        if (isMounted) setIsLoadingCategories(false);
      }
    };
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update form fields if initialValues change (e.g. after async fetch)
  useEffect(() => {
    if (initialValues) {
      if (initialValues.title !== undefined) setTitle(initialValues.title);
      if (initialValues.category !== undefined) setCategory(initialValues.category);
      if (initialValues.price !== undefined) setPrice(String(initialValues.price));
      if (initialValues.stock !== undefined) setStock(String(initialValues.stock));
      if (initialValues.description !== undefined) setDescription(initialValues.description);
      if (initialValues.thumbnail !== undefined) setThumbnail(initialValues.thumbnail);
      if (initialValues.brand !== undefined) setBrand(initialValues.brand || "");
      if (initialValues.discountPercentage !== undefined)
        setDiscountPercentage(String(initialValues.discountPercentage));
    }
  }, [initialValues]);

  /**
   * Validates form fields and returns boolean validity.
   */
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // 1. Title Validation
    if (!title.trim()) {
      newErrors.title = "Product title is required.";
    } else if (title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters.";
    }

    // 2. Category Validation
    if (!category.trim()) {
      newErrors.category = "Please select a category.";
    }

    // 3. Price Validation
    const numPrice = parseFloat(price);
    if (!price.trim()) {
      newErrors.price = "Price is required.";
    } else if (isNaN(numPrice) || numPrice <= 0) {
      newErrors.price = "Price must be a positive number greater than 0.";
    }

    // 4. Stock Validation
    const numStock = parseInt(stock, 10);
    if (!stock.trim()) {
      newErrors.stock = "Inventory stock quantity is required.";
    } else if (isNaN(numStock) || numStock < 0) {
      newErrors.stock = "Stock must be a non-negative integer (0 or greater).";
    }

    // 5. Description Validation
    if (!description.trim()) {
      newErrors.description = "Description is required.";
    } else if (description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters long.";
    }

    // 6. Thumbnail URL Validation
    if (!thumbnail.trim()) {
      newErrors.thumbnail = "Image URL is required.";
    } else {
      try {
        const url = new URL(thumbnail.trim());
        if (url.protocol !== "http:" && url.protocol !== "https:") {
          newErrors.thumbnail = "Image URL must start with http:// or https://";
        }
      } catch {
        newErrors.thumbnail = "Please enter a valid URL (e.g. https://example.com/image.webp)";
      }
    }

    // 7. Discount Validation (Optional)
    if (discountPercentage.trim()) {
      const numDiscount = parseFloat(discountPercentage);
      if (isNaN(numDiscount) || numDiscount < 0 || numDiscount > 100) {
        newErrors.discountPercentage = "Discount must be between 0% and 100%.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Guard against rapid duplicate submissions
    if (isSubmittingRef.current || isSubmitting) {
      return;
    }

    // Mark all fields touched
    setTouched({
      title: true,
      category: true,
      price: true,
      stock: true,
      description: true,
      thumbnail: true,
      discountPercentage: true,
    });

    if (!validate()) {
      return;
    }

    isSubmittingRef.current = true;

    try {
      const values: ProductFormValues = {
        title: title.trim(),
        category: category.trim(),
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        description: description.trim(),
        thumbnail: thumbnail.trim(),
        brand: brand.trim() || undefined,
        discountPercentage: discountPercentage.trim() ? parseFloat(discountPercentage) : undefined,
      };

      await onSubmit(values);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const isValid = Object.keys(errors).length === 0;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Section 1: Basic Information */}
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight mb-1">
            General Information
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Core product naming, brand details, and category categorization.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Title Field */}
            <div className="sm:col-span-2">
              <label
                htmlFor="product-title"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Product Title <span className="text-danger-500">*</span>
              </label>
              <input
                id="product-title"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors({ ...errors, title: undefined });
                }}
                onBlur={() => handleBlur("title")}
                placeholder="e.g. Wireless Noise-Cancelling Headphones"
                disabled={isSubmitting}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:bg-white transition-colors ${
                  touched.title && errors.title
                    ? "border-danger-500 ring-1 ring-danger-500"
                    : "border-slate-300"
                }`}
              />
              {touched.title && errors.title && (
                <p className="mt-1.5 text-xs text-danger-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.title}</span>
                </p>
              )}
            </div>

            {/* Category Select */}
            <div>
              <label
                htmlFor="product-category"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Category <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="product-category"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    if (errors.category) setErrors({ ...errors, category: undefined });
                  }}
                  onBlur={() => handleBlur("category")}
                  disabled={isSubmitting || isLoadingCategories}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:bg-white transition-colors cursor-pointer capitalize ${
                    touched.category && errors.category
                      ? "border-danger-500 ring-1 ring-danger-500"
                      : "border-slate-300"
                  }`}
                >
                  <option value="">Select a category...</option>
                  {categories.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              {touched.category && errors.category && (
                <p className="mt-1.5 text-xs text-danger-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.category}</span>
                </p>
              )}
            </div>

            {/* Brand Field (Optional) */}
            <div>
              <label
                htmlFor="product-brand"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Brand / Manufacturer <span className="text-slate-400 lowercase font-normal">(optional)</span>
              </label>
              <input
                id="product-brand"
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Sony, Apple, Nike"
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Pricing & Inventory */}
        <div className="pt-6 border-t border-slate-100">
          <h2 className="text-base font-bold text-slate-900 tracking-tight mb-1">
            Pricing &amp; Inventory
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Configure retail pricing, promotional discounts, and warehouse stock units.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Price Field */}
            <div>
              <label
                htmlFor="product-price"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Price (INR ₹) <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <input
                  id="product-price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    if (errors.price) setErrors({ ...errors, price: undefined });
                  }}
                  onBlur={() => handleBlur("price")}
                  placeholder="29.99"
                  disabled={isSubmitting}
                  className={`w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border rounded-lg text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:bg-white transition-colors ${
                    touched.price && errors.price
                      ? "border-danger-500 ring-1 ring-danger-500"
                      : "border-slate-300"
                  }`}
                />
              </div>
              {touched.price && errors.price && (
                <p className="mt-1.5 text-xs text-danger-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.price}</span>
                </p>
              )}
            </div>

            {/* Stock Field */}
            <div>
              <label
                htmlFor="product-stock"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Inventory Stock <span className="text-danger-500">*</span>
              </label>
              <input
                id="product-stock"
                type="number"
                step="1"
                min="0"
                value={stock}
                onChange={(e) => {
                  setStock(e.target.value);
                  if (errors.stock) setErrors({ ...errors, stock: undefined });
                }}
                onBlur={() => handleBlur("stock")}
                placeholder="100"
                disabled={isSubmitting}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:bg-white transition-colors ${
                  touched.stock && errors.stock
                    ? "border-danger-500 ring-1 ring-danger-500"
                    : "border-slate-300"
                }`}
              />
              {touched.stock && errors.stock && (
                <p className="mt-1.5 text-xs text-danger-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.stock}</span>
                </p>
              )}
            </div>

            {/* Discount Percentage (Optional) */}
            <div>
              <label
                htmlFor="product-discount"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Discount % <span className="text-slate-400 lowercase font-normal">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Percent className="w-4 h-4" />
                </div>
                <input
                  id="product-discount"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={discountPercentage}
                  onChange={(e) => {
                    setDiscountPercentage(e.target.value);
                    if (errors.discountPercentage)
                      setErrors({ ...errors, discountPercentage: undefined });
                  }}
                  onBlur={() => handleBlur("discountPercentage")}
                  placeholder="10.5"
                  disabled={isSubmitting}
                  className={`w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border rounded-lg text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:bg-white transition-colors ${
                    touched.discountPercentage && errors.discountPercentage
                      ? "border-danger-500 ring-1 ring-danger-500"
                      : "border-slate-300"
                  }`}
                />
              </div>
              {touched.discountPercentage && errors.discountPercentage && (
                <p className="mt-1.5 text-xs text-danger-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.discountPercentage}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Media & Description */}
        <div className="pt-6 border-t border-slate-100">
          <h2 className="text-base font-bold text-slate-900 tracking-tight mb-1">
            Media &amp; Copy
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Add full product specifications and a direct image thumbnail URL.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Inputs (8 cols) */}
            <div className="lg:col-span-8 space-y-5">
              {/* Thumbnail URL */}
              <div>
                <label
                  htmlFor="product-thumbnail"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Image Thumbnail URL <span className="text-danger-500">*</span>
                </label>
                <input
                  id="product-thumbnail"
                  type="url"
                  value={thumbnail}
                  onChange={(e) => {
                    setThumbnail(e.target.value);
                    setImagePreviewError(false);
                    if (errors.thumbnail) setErrors({ ...errors, thumbnail: undefined });
                  }}
                  onBlur={() => handleBlur("thumbnail")}
                  placeholder="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop"
                  disabled={isSubmitting}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:bg-white transition-colors ${
                    touched.thumbnail && errors.thumbnail
                      ? "border-danger-500 ring-1 ring-danger-500"
                      : "border-slate-300"
                  }`}
                />
                {touched.thumbnail && errors.thumbnail && (
                  <p className="mt-1.5 text-xs text-danger-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.thumbnail}</span>
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="product-description"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Full Description <span className="text-danger-500">*</span>
                </label>
                <textarea
                  id="product-description"
                  rows={4}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) setErrors({ ...errors, description: undefined });
                  }}
                  onBlur={() => handleBlur("description")}
                  placeholder="Provide an in-depth description of the product features, specifications, and materials..."
                  disabled={isSubmitting}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:bg-white transition-colors resize-y ${
                    touched.description && errors.description
                      ? "border-danger-500 ring-1 ring-danger-500"
                      : "border-slate-300"
                  }`}
                />
                <div className="flex items-center justify-between mt-1">
                  {touched.description && errors.description ? (
                    <p className="text-xs text-danger-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.description}</span>
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className="text-[11px] text-slate-400">
                    {description.length} characters (min 10)
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Live Image Preview Box (4 cols) */}
            <div className="lg:col-span-4">
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Live Image Preview
              </span>
              <div className="aspect-square bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center relative p-3">
                {thumbnail.trim() && !imagePreviewError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumbnail.trim()}
                    alt="Preview"
                    onError={() => setImagePreviewError(true)}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5 text-center p-3">
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                    <span className="text-[11px] font-medium text-slate-400">
                      {imagePreviewError
                        ? "Unable to load image from URL"
                        : "Enter a valid image URL to preview"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Action Controls */}
      <div className="flex items-center justify-end gap-3 select-none">
        <button
          type="button"
          onClick={() => router.push(cancelHref)}
          disabled={isSubmitting}
          className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
        >
          Cancel
        </button>

        <button
          type="submit"
          id="product-form-submit-button"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs font-semibold rounded-lg shadow-sm shadow-primary-600/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitButtonText}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
