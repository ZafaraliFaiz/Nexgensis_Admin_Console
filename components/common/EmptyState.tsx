/**
 * components/common/EmptyState.tsx
 *
 * Generic empty state component with enterprise aesthetic for zero-result screens.
 *
 * Capabilities:
 * 1. Visual Focal Point: Modern icon badge with subtle Slate accent background.
 * 2. Clear Messaging: Descriptive heading and explanatory body copy.
 * 3. Optional Action Button: Allows callers to inject a reset, clear filter, or create action.
 */

import React from "react";
import { PackageOpen } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title = "No products found",
  description = "There are no products matching your current criteria. Try adjusting your query or page size.",
  icon: Icon = PackageOpen,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 sm:p-16 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mb-4 shadow-sm">
        <Icon className="w-7 h-7 text-slate-500" />
      </div>

      <h3 className="text-base font-semibold text-slate-900 tracking-tight mb-1">
        {title}
      </h3>

      <p className="text-sm text-slate-500 max-w-sm mb-6">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
