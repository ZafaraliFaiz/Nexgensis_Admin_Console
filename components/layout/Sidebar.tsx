"use client";

/**
 * components/layout/Sidebar.tsx
 *
 * Collapsible sidebar navigation for the enterprise dashboard layout.
 *
 * Capabilities:
 * 1. Responsive Modes:
 *    - Desktop: Smoothly transitions between expanded (w-64) and compact (w-20) icon mode.
 *    - Mobile: Operates as an off-canvas drawer with backdrop dismiss.
 * 2. Active Route Highlighting: Uses `usePathname()` to apply SaaS active states with subtle left accent indicators.
 * 3. Bottom Session Card: Shows current user details and quick sign-out action.
 */

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAuthSession } from "@/lib/utils/authStorage";
import {
  LayoutDashboard,
  Package,
  ShieldCheck,
  LogOut,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Products",
    href: "/products",
    icon: Package,
    badge: "Catalog",
  },
];

export default function Sidebar({
  isMobileOpen,
  onCloseMobile,
  isCollapsed,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearAuthSession();
    toast.success("Logged out successfully");
    router.replace("/login");
  };

  /**
   * Evaluates if a given nav item is active based on the current URL pathname.
   */
  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 select-none">
      {/* Sidebar Header / Brand */}
      <div className={`h-16 flex items-center border-b border-slate-800 ${isCollapsed ? "justify-center px-2" : "justify-between px-6"}`}>
        <Link href="/products" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-md shadow-primary-600/30 group-hover:scale-105 transition-transform shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-base text-white tracking-tight leading-tight">
                NexGensis
              </span>
              <span className="text-[10px] uppercase font-semibold text-primary-400 tracking-wider">
                Admin Console
              </span>
            </div>
          )}
        </Link>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        {!isCollapsed && (
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Main Menu
          </p>
        )}

        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                active
                  ? "bg-primary-600 text-white shadow-sm shadow-primary-600/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/80"
              } ${isCollapsed ? "justify-center px-0" : ""}`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-colors ${
                  active ? "text-white" : "text-slate-400 group-hover:text-white"
                }`}
              />

              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1">
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        active
                          ? "bg-primary-700/80 text-primary-100"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom Session / Sign Out Section */}
      <div className="p-3 border-t border-slate-800">
        <button
          type="button"
          onClick={handleLogout}
          title={isCollapsed ? "Sign out" : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-danger-400 hover:bg-danger-500/10 transition-colors cursor-pointer group ${
            isCollapsed ? "justify-center px-0" : ""
          }`}
        >
          <LogOut className="w-4 h-4 text-slate-400 group-hover:text-danger-400 shrink-0" />
          {!isCollapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sticky Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div
          className={`h-screen sticky top-0 transition-all duration-300 ease-in-out ${
            isCollapsed ? "w-20" : "w-64"
          }`}
        >
          {sidebarContent}
        </div>
      </aside>
    </>
  );
}
