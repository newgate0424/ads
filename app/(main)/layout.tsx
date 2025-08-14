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
            <div className="flex">
                <Sidebar />
               <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950">
    {children}
</main>
            </div>
        </SettingsProvider>
    );
}