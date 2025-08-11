'use client';

import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Menu } from "lucide-react";
import Sidebar from "./sidebar";
import { usePathname } from "next/navigation";

// สร้าง Array ของชื่อหน้าเว็บเพื่อให้ Header แสดงชื่อได้ถูกต้อง
const pageTitles: { [key: string]: string } = {
    '/overview': 'ภาพรวมรายทีม',
    '/dashboard': 'Data History',
    '/monitor': 'Monitor',
    '/settings': 'ตั้งค่า',
};

export default function MobileHeader() {
    const pathname = usePathname();
    const title = pageTitles[pathname] || 'Dashboard';

    return (
        <header className="md:hidden sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
                <Drawer direction="left">
                    <DrawerTrigger asChild>
                        <button className="p-2 -ml-2">
                            <Menu className="h-6 w-6" />
                            <span className="sr-only">Toggle Menu</span>
                        </button>
                    </DrawerTrigger>
                    <DrawerContent className="h-full w-72 p-0">
                        {/* เราจะนำ Sidebar ทั้งอันมาใส่ใน Drawer */}
                        <Sidebar />
                    </DrawerContent>
                </Drawer>
                <div className="flex flex-1 items-center justify-end space-x-4">
                    <span className="font-bold">{title}</span>
                </div>
            </div>
        </header>
    );
}