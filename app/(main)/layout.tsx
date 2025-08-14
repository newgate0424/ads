import Sidebar from "@/components/layout/sidebar";
import { SettingsProvider } from "@/components/settings-provider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";

export default async function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/');
    }
    
    return (
        <SettingsProvider>
            <div className="flex h-screen overflow-hidden">
                <Sidebar />
               <main className={cn(
                   // --- 🟢 ส่วนที่แก้ไข: เพิ่ม min-w-0 และ overflow-y-auto ---
                   "flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto", 
                   "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50",
                   "dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950"
               )}>
                    {children}
                </main>
            </div>
        </SettingsProvider>
    );
}