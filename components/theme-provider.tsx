"use client"

import * as React from "react"
// แก้ไข import 2 บรรทัดเดิม ให้เหลือบรรทัดนี้บรรทัดเดียว
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}