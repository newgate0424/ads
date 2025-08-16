'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LayoutDashboard, Settings, LogOut, PanelLeft, PanelRight, Activity, Home, Users, TestTube2 } from 'lucide-react';
import { useSettings } from '@/components/settings-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

const navItems = [
    { href: '/overview', label: 'Overview', icon: Home },
    { href: '/overview-beta', label: 'Overview (Beta)', icon: TestTube2 },
    { href: '/monitor', label: 'Monitor', icon: Activity },
    { href: '/admin', label: 'User Management', icon: Users },
    { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { isCollapsed, updateSidebarState, isSettingsLoading } = useSettings();

    if (isSettingsLoading) {
        return <aside className="h-screen w-16 p-2"><Skeleton className="h-full w-full" /></aside>;
    }

    return (
        <TooltipProvider delayDuration={100}>
            <aside
                className={cn(
                    "sticky top-0 h-screen bg-background border-r flex flex-col p-2 transition-all duration-300 ease-in-out",
                    isCollapsed ? "w-16" : "w-60"
                )}
            >
                <div className="flex items-center p-2 mb-4">
                    <LayoutDashboard className="h-8 w-8 text-primary flex-shrink-0" />
                    <h1 className={cn("text-xl font-bold transition-all ml-2 whitespace-nowrap", isCollapsed ? "opacity-0 w-0" : "opacity-100")}>
                        Dashboard
                    </h1>
                </div>

                <nav className="flex flex-col gap-2 flex-1">
                    {navItems.map((item) => (
                        <Tooltip key={item.href}>
                            <TooltipTrigger asChild>
                                <Link href={item.href}>
                                    <Button
                                        // --- 🟢 ส่วนที่แก้ไข ---
                                        // เปลี่ยนจากการใช้ฟังก์ชันซับซ้อน มาเป็นการเช็ค === ตรงๆ
                                        variant={pathname === item.href ? 'default' : 'ghost'}
                                        // --- สิ้นสุดส่วนที่แก้ไข ---
                                        className="w-full justify-start h-10 px-3"
                                    >
                                        <item.icon className="h-5 w-5 flex-shrink-0" />
                                        <span className={cn("whitespace-nowrap ml-4", isCollapsed && "sr-only")}>{item.label}</span>
                                    </Button>
                                </Link>
                            </TooltipTrigger>
                            {isCollapsed && (
                                <TooltipContent side="right">
                                    <p>{item.label}</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    ))}
                </nav>

                <Separator className="my-2" />

                <div className="mt-auto flex flex-col gap-2 mb-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                className="w-full justify-start h-10 px-3"
                                onClick={() => updateSidebarState(!isCollapsed)}
                            >
                                <div className="flex-shrink-0">
                                    {isCollapsed ? <PanelRight className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
                                </div>
                                <span className={cn("whitespace-nowrap ml-4", isCollapsed && "sr-only")}>Toggle Sidebar</span>
                            </Button>
                        </TooltipTrigger>
                         {isCollapsed && (
                             <TooltipContent side="right">
                                <p>Open Sidebar</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                    
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Button variant="destructive" className="w-full justify-start h-10 px-3" onClick={() => signOut({ callbackUrl: '/' })}>
                                <LogOut className="h-5 w-5 flex-shrink-0" />
                                <span className={cn("whitespace-nowrap ml-4", isCollapsed && "sr-only")}>Logout</span>
                            </Button>
                        </TooltipTrigger>
                        {isCollapsed && (
                             <TooltipContent side="right">
                                <p>Logout</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </div>
            </aside>
        </TooltipProvider>
    );
}