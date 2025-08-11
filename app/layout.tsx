import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

// ✅ 1. ตรวจสอบให้แน่ใจว่ามีการประกาศ font Sarabun อยู่
const sarabun = Sarabun({
  subsets: ["latin", "thai"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "My Dashboard",
  description: "Dashboard created with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* ✅ 2. ใช้ className ของ font แต่ไม่มีคลาสจำกัดความกว้าง */}
      <body className={sarabun.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}