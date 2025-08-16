'use client';

import Sidebar from "@/components/layout/sidebar";
import { useSettings } from "@/components/settings-provider";
import { cn } from "@/lib/utils";

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const { backgroundStyle } = useSettings();

    // 🟢 แก้ไข: เพิ่ม div ที่ซ่อนอยู่เพื่อบังคับให้ Tailwind รวมคลาสพื้นหลังทั้งหมด
    // นี่คือวิธีแก้ปัญหาทั่วไปสำหรับ Tailwind เมื่อใช้คลาสแบบไดนามิก
    const tailwindSafelist = (
      <div className="hidden">
        <div className="bg-gradient-default" />
        <div className="bg-gradient-ocean" />
        <div className="bg-gradient-sunset" />
        <div className="bg-gradient-forest" />
        <div className="dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950" />
        <div className="dark:from-blue-950 via-teal-950 to-green-950" />
        <div className="dark:from-yellow-950 via-orange-950 to-red-950" />
        <div className="dark:from-lime-950 via-green-950 to-teal-950" />
      </div>
    );
    
    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className={cn(
                "flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto",
                backgroundStyle
            )}>
                {tailwindSafelist}
                {children}
            </main>
        </div>
    );
}