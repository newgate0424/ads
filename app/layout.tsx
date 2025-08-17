import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google"; 
import { cn } from "@/lib/utils";
import "./globals.css";
import { Providers } from "@/components/providers";

const fontSans = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "SA-ADS",
  description: "Dashboard created with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("font-sans", fontSans.variable)}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}