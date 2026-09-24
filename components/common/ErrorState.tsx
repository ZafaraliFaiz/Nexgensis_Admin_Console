/**
 * components/common/ErrorState.tsx
 *
 * Dedicated error state presentation card with integrated retry action.
 *
 * Capabilities:
 * 1. Normalized Error Display: Formats `ApiError` payloads with HTTP status badges.
 * 2. Visual Cue: Red danger semantic styling indicating critical query failure.
 * 3. Instant Retry Trigger: Dispatches a reload action to re-fire the failed network request.
 */

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { ApiError } from "@/types";

interface ErrorStateProps {
  error: ApiError | null;
  onRetry: () => void;
  title?: string;
}

export default function ErrorState({
  error,
  onRetry,
  title = "Failed to load product catalog",
}: ErrorStateProps) {
  const errorMessage =
    error?.message || "An unexpected error occurred while communicating with the catalog service.";
  const statusCode = error?.status;

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white border border-danger-200 rounded-2xl shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-danger-50 border border-danger-100 text-danger-600 flex items-center justify-center mb-4 shadow-sm">
        <AlertTriangle className="w-7 h-7 text-danger-600" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-danger-50 text-danger-700 border border-danger-200 mb-2">
        {statusCode ? `HTTP Error ${statusCode}` : "Network Failure"}
      </div>

      <h3 className="text-base font-bold text-slate-900 tracking-tight mb-1">
        {title}
      </h3>

      <p className="text-sm text-slate-600 max-w-md mb-6 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
        {errorMessage}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs font-semibold rounded-lg shadow-sm shadow-primary-600/30 transition-all cursor-pointer"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Retry Request</span>
      </button>
    </div>
  );
}
