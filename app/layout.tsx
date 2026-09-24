/**
 * app/layout.tsx
 *
 * Root layout component wrapping all routes in the application.
 *
 * Capabilities:
 * 1. Global Typography: Integrates Google's Inter font variable.
 * 2. Toast System: Mounts `ToasterProvider` for application-wide notifications.
 * 3. Base HTML & Metadata: Configures enterprise document title and meta properties.
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ToasterProvider from "@/components/common/ToasterProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NexGensis Admin | Enterprise Catalog Console",
    template: "%s | NexGensis Admin",
  },
  description: "Enterprise SaaS product catalog management dashboard built with Next.js 14 App Router, TypeScript, and Tailwind CSS.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body
        className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans"
        suppressHydrationWarning
      >
        <ToasterProvider />
        {children}
      </body>
    </html>
  );
}
