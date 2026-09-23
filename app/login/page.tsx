"use client";

/**
 * app/login/page.tsx
 *
 * Authentication login view for the Product Admin Dashboard.
 *
 * Key Capabilities & UX Features:
 * 1. Double-click Prevention: Uses both React state (`isLoading`) and an immediate mutable ref (`isSubmittingRef`)
 *    to prevent concurrent duplicate in-flight requests from rapid user clicks.
 * 2. Multi-Tier Error Reporting: Combines localized inline banner alerts with global `react-hot-toast` notifications.
 * 3. Quick-Fill Demo Bar: Provides one-click credential autofill (`emilys` / `emilyspass`) to streamline evaluations.
 * 4. Token & Session Persistence: Synchronizes credentials across cookies and localStorage before navigating to `/products`.
 */

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api/auth";
import { setAuthSession, isAuthenticated } from "@/lib/utils/authStorage";
import { ApiError } from "@/types";
import toast from "react-hot-toast";
import { Lock, User as UserIcon, Loader2, AlertCircle, Eye, EyeOff, ShieldCheck, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  // Form input states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Validation & async loading states
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mutable ref to guarantee immediate blocking of rapid double-clicks
  const isSubmittingRef = useRef(false);

  // If already authenticated, redirect to /products directly
  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/products");
    }
  }, [router]);

  /**
   * Validates form inputs before dispatching API request.
   */
  const validate = (): boolean => {
    const errors: { username?: string; password?: string } = {};

    if (!username.trim()) {
      errors.username = "Username is required.";
    }
    if (!password) {
      errors.password = "Password is required.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Quick-fill demo credentials for frictionless walkthroughs and evaluations
   */
  const handleQuickFill = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setFieldErrors({});
    setApiError(null);
  };

  /**
   * Form submission handler with double-click guard and error handling
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Guard against rapid duplicate clicks while request is pending
    if (isSubmittingRef.current || isLoading) {
      return;
    }

    setApiError(null);

    if (!validate()) {
      return;
    }

    // Set lock flag and UI spinner
    isSubmittingRef.current = true;
    setIsLoading(true);

    try {
      const user = await login({ username, password });
      const token = user.accessToken || user.token;

      if (!token) {
        throw { message: "Authentication succeeded but no token was returned by server." } as ApiError;
      }

      // Persist auth tokens in storage and edge-readable cookies
      setAuthSession(user, token);

      toast.success(`Welcome back, ${user.firstName || user.username}!`);
      router.push("/products");
    } catch (err) {
      const error = err as ApiError;
      const message = error.message || "Invalid username or password. Please try again.";
      setApiError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 px-4 py-12 relative overflow-hidden">
      {/* Subtle SaaS background radial accents */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-200/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-100/60 rounded-full blur-3xl pointer-events-none" />

      {/* Main Authentication Card */}
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 p-8 sm:p-10 z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-600/30 mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            NexGensis Admin
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Sign in to manage the enterprise product catalog
          </p>
        </div>

        {/* Inline API Error Alert */}
        {apiError && (
          <div className="mb-6 p-4 rounded-lg bg-danger-50 border border-danger-100 flex items-start gap-3 text-sm text-danger-700 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-danger-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Authentication Failed:</span> {apiError}
            </div>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Username Field */}
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: undefined });
                }}
                disabled={isLoading}
                placeholder="e.g. emilys"
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:bg-white transition-colors ${
                  fieldErrors.username ? "border-danger-500 ring-1 ring-danger-500" : "border-slate-300"
                }`}
              />
            </div>
            {fieldErrors.username && (
              <p className="mt-1.5 text-xs text-danger-600 font-medium">{fieldErrors.username}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Password
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                }}
                disabled={isLoading}
                placeholder="••••••••"
                className={`w-full pl-10 pr-11 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:bg-white transition-colors ${
                  fieldErrors.password ? "border-danger-500 ring-1 ring-danger-500" : "border-slate-300"
                }`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1.5 text-xs text-danger-600 font-medium">{fieldErrors.password}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="login-submit-button"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-medium text-sm rounded-lg shadow-sm shadow-primary-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <span>Sign in to Dashboard</span>
            )}
          </button>
        </form>

        {/* Demo Credentials Helper Pill */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2.5">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-primary-600" />
              Demo Accounts:
            </span>
            <span>DummyJSON Live Auth</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill("emilys", "emilyspass")}
              className="px-3 py-2 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs transition-colors group cursor-pointer"
            >
              <div className="font-semibold text-slate-800 group-hover:text-primary-600">emilys</div>
              <div className="text-slate-400 font-mono text-[11px]">emilyspass</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill("michaelw", "michaelwpass")}
              className="px-3 py-2 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs transition-colors group cursor-pointer"
            >
              <div className="font-semibold text-slate-800 group-hover:text-primary-600">michaelw</div>
              <div className="text-slate-400 font-mono text-[11px]">michaelwpass</div>
            </button>
          </div>
        </div>
      </div>

      {/* Footer copyright / info */}
      <div className="mt-8 text-center text-xs text-slate-400">
        Enterprise Product Catalog Management &bull; Built with Next.js &amp; Tailwind
      </div>
    </div>
  );
}
