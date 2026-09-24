"use client";

/**
 * components/products/ProductGallery.tsx
 *
 * Interactive product image gallery with thumbnail navigation and main preview.
 *
 * Capabilities:
 * 1. Dynamic Image Switching: Seamlessly changes active preview when clicking thumbnail strip.
 * 2. Robust Fallback Handling: Safely falls back to thumbnail or placeholder icon if images array is empty.
 * 3. Enterprise Presentation: Subtle borders, zoom transitions, and badge overlay.
 */

import React, { useState, useEffect } from "react";
import { Package, Image as ImageIcon } from "lucide-react";

interface ProductGalleryProps {
  images: string[];
  title: string;
  thumbnail: string;
}

export default function ProductGallery({
  images,
  title,
  thumbnail,
}: ProductGalleryProps) {
  // Normalize images list ensuring thumbnail is included if images array is empty
  const rawImages = Array.isArray(images) && images.length > 0 ? images : thumbnail ? [thumbnail] : [];
  const [selectedImage, setSelectedImage] = useState<string>(rawImages[0] || "");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (rawImages.length > 0) {
      setSelectedImage(rawImages[0]);
      setHasError(false);
    }
  }, [images, thumbnail]);

  return (
    <div className="space-y-3.5 select-none">
      {/* Main Image Frame */}
      <div className="aspect-square bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center relative p-6 group">
        {selectedImage && !hasError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={selectedImage}
            alt={title}
            onError={() => setHasError(true)}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
            <Package className="w-16 h-16 stroke-1" />
            <span className="text-xs font-medium">No Image Available</span>
          </div>
        )}

        {/* Total images badge */}
        {rawImages.length > 1 && (
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/70 backdrop-blur-sm text-white text-[11px] font-medium flex items-center gap-1.5">
            <ImageIcon className="w-3 h-3" />
            <span>{rawImages.indexOf(selectedImage) + 1} / {rawImages.length}</span>
          </div>
        )}
      </div>

      {/* Thumbnail Selector Strip (rendered only when > 1 image) */}
      {rawImages.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
          {rawImages.map((imgUrl, idx) => {
            const isSelected = selectedImage === imgUrl;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedImage(imgUrl);
                  setHasError(false);
                }}
                className={`w-16 h-16 rounded-xl bg-slate-50 border overflow-hidden shrink-0 transition-all p-1 cursor-pointer ${
                  isSelected
                    ? "border-primary-600 ring-2 ring-primary-600/30 scale-95"
                    : "border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imgUrl}
                  alt={`${title} thumbnail ${idx + 1}`}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
