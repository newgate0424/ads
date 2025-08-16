import Sidebar from "@/components/layout/sidebar";
import { SettingsProvider } from "@/components/settings-provider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

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
               {/* --- 🟢 ส่วนที่แก้ไข: ลบ class พื้นหลังที่ตายตัวออก --- */}
               <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
                    {children}
                </main>
            </div>
        </SettingsProvider>
    );
}