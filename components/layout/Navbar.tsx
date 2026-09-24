"use client";

/**
 * components/layout/Navbar.tsx
 *
 * Top navigation bar component for the enterprise admin dashboard.
 *
 * Capabilities:
 * 1. Mobile Sidebar Toggle: Controls drawer opening on mobile devices.
 * 2. Desktop Collapse Toggle: Enables collapsing the sidebar to compact icon mode.
 * 3. User Menu & Logout: Displays the logged-in user profile, avatar fallback, and
 *    executes safe session teardown with notification and route redirect.
 */

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getAuthUser, clearAuthSession } from "@/lib/utils/authStorage";
import { User } from "@/types";
import toast from "react-hot-toast";
import {
  Menu,
  LogOut,
  ChevronDown,
  ShieldCheck,
  User as UserIcon,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface NavbarProps {
  onToggleMobileSidebar: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebarCollapse: () => void;
}

export default function Navbar({
  onToggleMobileSidebar,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
}: NavbarProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load user session on mount
  useEffect(() => {
    setUser(getAuthUser());
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * Clears auth tokens and cookies, emits feedback, and redirects to login page.
   */
  const handleLogout = () => {
    clearAuthSession();
    toast.success("Logged out successfully");
    router.replace("/login");
  };

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() || user.username : "Admin User";
  const userInitial = user?.firstName?.[0] || user?.username?.[0]?.toUpperCase() || "A";

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left section: Sidebar toggle buttons + Breadcrumb/Title */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Open mobile menu"
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleSidebarCollapse}
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden lg:flex p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand indicator for compact mode */}
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Catalog
          </span>
        </div>
      </div>

      {/* Right section: API status + User menu */}
      <div className="flex items-center gap-4">
        {/* Cloud Status Indicator */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 py-1 px-2.5 rounded-full bg-slate-100 border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium">Cloud Connected</span>
        </div>

        {/* User profile dropdown container */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-expanded={isDropdownOpen}
          >
            {/* User Avatar */}
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover border border-slate-200 bg-slate-100"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold text-xs shadow-sm">
                {userInitial}
              </div>
            )}

            {/* Name + Role display (Desktop) */}
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-tight">
                {displayName}
              </span>
              <span className="text-[11px] text-slate-500 leading-tight">
                {user?.email || "Administrator"}
              </span>
            </div>

            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu Modal */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Header inside dropdown */}
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-medium text-slate-400">Signed in as</p>
                <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email || "admin@nexgensis.com"}</p>
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" />
                  Administrator
                </div>
              </div>

              {/* Profile Links */}
              <div className="py-1">
                <div className="px-4 py-2 text-xs text-slate-600 flex items-center gap-2">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Username: <strong className="text-slate-900 font-mono">{user?.username}</strong></span>
                </div>
              </div>

              {/* Logout Action */}
              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  id="navbar-logout-button"
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-danger-600 hover:bg-danger-50 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-danger-600" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
