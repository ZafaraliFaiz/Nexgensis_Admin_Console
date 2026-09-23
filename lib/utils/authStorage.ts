/**
 * lib/utils/authStorage.ts
 *
 * Centralized client-side authentication and session token management.
 * 
 * Why this file exists:
 * 1. Synchronizes auth state across both localStorage (for instant client-side retrieval)
 *    and standard cookies (so Next.js Edge Middleware can inspect route access server-side).
 * 2. Provides clean, defensive browser-environment checks (safe for SSR execution).
 */

import { User } from "@/types";

const TOKEN_KEY = "product_admin_token";
const USER_KEY = "product_admin_user";
const COOKIE_NAME = "auth_token";

/**
 * Retrieves the stored JWT authentication token.
 * Checks localStorage first, then falls back to cookie parsing.
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  // 1. Try localStorage
  const localToken = localStorage.getItem(TOKEN_KEY);
  if (localToken) return localToken;

  // 2. Fallback to document.cookie
  const match = document.cookie.match(new RegExp("(^|; )" + COOKIE_NAME + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Retrieves the currently logged-in user profile from local storage.
 */
export function getAuthUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

/**
 * Persists user session across localStorage and cookies upon successful login.
 * Sets 7-day max-age cookie so Next.js Middleware can protect App Router routes.
 */
export function setAuthSession(user: User, token: string): void {
  if (typeof window === "undefined") return;

  // Store in localStorage for fast client-side lookup
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  // Store in cookie so Next.js Middleware can validate server-side requests
  // SameSite=Lax protects against CSRF while permitting top-level navigation
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/**
 * Clears active user session from both localStorage and cookies during logout.
 */
export function clearAuthSession(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  // Expire cookie immediately
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

/**
 * Utility helper to quickly verify if user has an active token.
 */
export function isAuthenticated(): boolean {
  return Boolean(getAuthToken());
}
