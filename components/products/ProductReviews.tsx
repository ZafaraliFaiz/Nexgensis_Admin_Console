/**
 * components/products/ProductReviews.tsx
 *
 * Customer reviews section for the product detail view.
 *
 * Capabilities:
 * 1. Resilient Schema Parsing: Safely handles missing, undefined, or empty `reviews` arrays without crashing.
 * 2. Visual Rating Breakdown: Calculates aggregate customer rating and star fill metrics.
 * 3. Individual Review Cards: Shows reviewer avatar initials, relative date, star badge, and comment.
 */

import React from "react";
import { Review } from "@/types";
import { Star, MessageSquare, User } from "lucide-react";

interface ProductReviewsProps {
  reviews?: Review[];
}

export default function ProductReviews({ reviews = [] }: ProductReviewsProps) {
  const safeReviews = Array.isArray(reviews) ? reviews : [];
  const hasReviews = safeReviews.length > 0;

  // Compute average score from verified reviews
  const avgRating = hasReviews
    ? (safeReviews.reduce((sum, r) => sum + r.rating, 0) / safeReviews.length).toFixed(1)
    : "0.0";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Section Header with aggregate summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold tracking-tight text-slate-900">
              Customer Reviews
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {safeReviews.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified customer ratings and feedback from the DummyJSON catalog
          </p>
        </div>

        {hasReviews && (
          <div className="flex items-center gap-3 bg-amber-50/60 border border-amber-200/80 px-3.5 py-2 rounded-xl">
            <div className="flex items-center text-amber-500">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 leading-none">
                {avgRating} <span className="text-xs text-slate-500 font-normal">/ 5.0</span>
              </div>
              <div className="text-[11px] text-amber-800 font-medium leading-tight">
                {safeReviews.length} verified {safeReviews.length === 1 ? "review" : "reviews"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reviews Content */}
      {!hasReviews ? (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 border border-slate-200/60 rounded-xl">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-2.5 text-slate-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-slate-800">No customer reviews yet</p>
          <p className="text-xs text-slate-500 max-w-sm mt-0.5">
            This product has not received any verified customer reviews in the catalog.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {safeReviews.map((review, idx) => {
            const formattedDate = review.date
              ? new Date(review.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "Recent";

            const initial = review.reviewerName ? review.reviewerName[0].toUpperCase() : "U";

            return (
              <div
                key={idx}
                className="bg-slate-50/75 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:bg-slate-50 transition-colors"
              >
                {/* Header: Reviewer + Stars */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {review.reviewerName || "Anonymous Customer"}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {review.reviewerEmail || formattedDate}
                      </div>
                    </div>
                  </div>

                  {/* Rating Badge */}
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-200 text-xs font-semibold text-amber-600 shrink-0">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{review.rating}</span>
                  </div>
                </div>

                {/* Comment Body */}
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  &ldquo;{review.comment}&rdquo;
                </p>

                {/* Date footer */}
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                  <span>Verified Purchase</span>
                  <span>{formattedDate}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
