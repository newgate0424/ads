'use client';

import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Menu } from "lucide-react";
import Sidebar from "./sidebar";
import { usePathname } from "next/navigation";

const pageTitles: { [key: string]: string } = {
    '/overview': 'ภาพรวมรายทีม',
    '/overview-beta': 'ภาพรวมรายทีม (Beta)',
    '/overview-beta-v2': 'ภาพรวมรายทีม (Beta v2)', // เพิ่มชื่อหน้าใหม่
    '/overview-beta-v3': 'ภาพรวมรายทีม (Beta v3)',
    '/overview-beta-v4': 'ภาพรวมรายทีม (Beta v4)', // เพิ่มชื่อหน้าใหม่
    '/dashboard': 'Data History',
    '/monitor': 'Monitor',
    '/admin': 'User Management',
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