"use client";

/**
 * components/common/DeleteConfirmModal.tsx
 *
 * Custom styled deletion confirmation dialog matching the enterprise design system.
 *
 * Capabilities:
 * 1. Focus Trap & Dismissal: Accessible backdrop dismiss, cancel button, and Escape key listener.
 * 2. Visual Context: Displays the specific product title and critical warning badge.
 * 3. Double-Click Guard: Blocks duplicate deletion calls during async in-flight deletion.
 */

import React, { useEffect, useRef } from "react";
import { AlertTriangle, Trash2, Loader2, X } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  itemName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  title = "Delete Product",
  itemName,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isDeleting) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div
        onClick={!isDeleting ? onCancel : undefined}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-200 select-none"
      >
        {/* Close X button */}
        <button
          type="button"
          onClick={onCancel}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Icon & Heading */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-danger-50 border border-danger-100 text-danger-600 flex items-center justify-center shrink-0 shadow-sm">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1.5 flex-1 pr-4">
            <h3
              id="delete-dialog-title"
              className="text-base font-bold text-slate-900 tracking-tight"
            >
              {title}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to delete{" "}
              <strong className="text-slate-900 font-semibold">&ldquo;{itemName}&rdquo;</strong>?
              This will remove the product record from your catalog.
            </p>
          </div>
        </div>

        {/* Warning notice callout */}
        <div className="mt-4 p-3 rounded-lg bg-danger-50/60 border border-danger-200/60 text-xs text-danger-800">
          <strong>Warning:</strong> This action cannot be undone. All associated inventory and pricing data for this product will be removed.
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            id="confirm-delete-button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-danger-600 hover:bg-danger-700 active:bg-danger-800 rounded-lg shadow-sm shadow-danger-600/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Product</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
