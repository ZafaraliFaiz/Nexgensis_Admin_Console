/**
 * middleware.ts
 *
 * Next.js Edge Middleware for server-side route protection and authentication redirects.
 *
 * Architectural Principles:
 * 1. Edge Verification: Validates the presence of `auth_token` cookie before rendering protected routes.
 * 2. Unauthenticated Guard: Redirects non-logged-in visitors trying to access `/products` or `/dashboard` to `/login`.
 * 3. Guest-Only Guard: Redirects already-logged-in users trying to access `/login` back to `/products`.
 * 4. Root Page Resolution: Seamlessly routes `/` to `/products` for members or `/login` for guests.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;

  // List of paths that require authentication
  const isProtectedRoute =
    pathname.startsWith("/products") ||
    pathname.startsWith("/dashboard");

  // Authentication entry path
  const isAuthRoute = pathname === "/login";

  // Root landing path
  const isRootRoute = pathname === "/";

  // Case 1: Visitor accessing protected route without auth token -> Redirect to /login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    // Preserve requested path for seamless post-login redirection if needed
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Case 2: Authenticated user attempting to access /login -> Redirect to /products
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/products", request.url));
  }

  // Case 3: Root "/" route redirection based on session status
  if (isRootRoute) {
    if (token) {
      return NextResponse.redirect(new URL("/products", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
