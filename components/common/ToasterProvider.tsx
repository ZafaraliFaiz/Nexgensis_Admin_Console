"use client";

/**
 * components/common/ToasterProvider.tsx
 *
 * Global toast notification provider wrapping `react-hot-toast`.
 *
 * Why this component exists:
 * Configures the unified toast notification theme matching our Enterprise SaaS design system:
 * - Positioned at top-right for optimal visibility without obstructing core data tables.
 * - Semantic coloring: Emerald-600 for positive confirmations, Red-600 for API/validation failures.
 * - Inter typography and crisp borders to match the Slate neutral scale.
 */

import React from "react";
import { Toaster } from "react-hot-toast";

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        className: "text-sm font-medium text-slate-900 border border-slate-200 shadow-lg rounded-xl",
        style: {
          background: "#ffffff",
          color: "#0f172a",
          padding: "12px 16px",
          borderRadius: "0.75rem",
          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        },
        success: {
          iconTheme: {
            primary: "#059669", // emerald-600
            secondary: "#ecfdf5", // emerald-50
          },
          style: {
            borderLeft: "4px solid #059669",
          },
        },
        error: {
          iconTheme: {
            primary: "#dc2626", // red-600
            secondary: "#fef2f2", // red-50
          },
          style: {
            borderLeft: "4px solid #dc2626",
          },
        },
      }}
    />
  );
}
