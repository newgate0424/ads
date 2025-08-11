// File: components/providers.tsx

"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react"; // ✅ 1. Import SessionProvider
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider> {/* ✅ 2. Wrap everything with SessionProvider */}
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </SessionProvider>
  );
}