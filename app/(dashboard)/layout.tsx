/**
 * app/(dashboard)/layout.tsx
 *
 * Route group layout for all authenticated dashboard screens (/products, /dashboard, etc.).
 *
 * Why this file exists:
 * Wraps all protected internal routes in the enterprise `DashboardLayout` shell (Sidebar + Navbar)
 * while leaving external pages like `/login` independent and clean.
 */

import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function AuthenticatedDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
