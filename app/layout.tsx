import type { Metadata } from "next";
// 1. เปลี่ยนการ import เป็น Noto_Sans_Thai
import { Noto_Sans_Thai } from "next/font/google"; 
import { cn } from "@/lib/utils";
import "./globals.css";
import { Providers } from "@/components/providers";

// 2. กำหนดค่าฟอนต์ใหม่เป็น Noto_Sans_Thai และสร้าง CSS Variable
const fontSans = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
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
      {/* 3. ใช้ cn เพื่อรวมคลาสฟอนต์เข้าไปใน body */}
      <body className={cn("font-sans", fontSans.variable)}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}