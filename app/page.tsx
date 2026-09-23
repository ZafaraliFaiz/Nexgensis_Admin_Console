/**
 * app/page.tsx
 *
 * Root route entry component.
 *
 * Why this file exists:
 * While Next.js Edge Middleware handles server-level redirection at runtime,
 * this component acts as a defensive fallback redirector for static exports or SSR instances.
 */

import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function RootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (token) {
    redirect("/products");
  } else {
    redirect("/login");
  }
}
