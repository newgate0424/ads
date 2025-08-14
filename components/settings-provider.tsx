'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useTheme as useNextTheme } from 'next-themes';
import { colorThemes } from '@/lib/constants';
import { signOut } from 'next-auth/react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

type SettingsContextType = {
    isCollapsed: boolean;
    theme: string;
    colorTheme: string;
    timeRange: string;
    updateSidebarState: (isCollapsed: boolean) => void;
    updateTheme: (theme: 'light' | 'dark' | 'system') => void;
    updateColorTheme: (colorClass: string) => void;
    updateTimeRange: (range: string) => void;
    isSettingsLoading: boolean;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [theme, setThemeState] = useState('system');
    const [colorTheme, setColorThemeState] = useState('theme-blue');
    const [timeRange, setTimeRange] = useState('today');
    const [isSettingsLoading, setIsSettingsLoading] = useState(true);
    const [showSessionExpiredDialog, setShowSessionExpiredDialog] = useState(false);

    const { setTheme: setNextTheme } = useNextTheme();

    const checkSession = useCallback(async () => {
        try {
            const res = await fetch('/api/auth/session');
            const session = await res.json();
            
            if (!session || Object.keys(session).length === 0 || !session.user) {
                if(!showSessionExpiredDialog) setShowSessionExpiredDialog(true);
            }
        } catch (error) {
            console.error('Failed to check session:', error);
        }
    }, [showSessionExpiredDialog]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/user/settings');
                if (res.ok) {
                    const data = await res.json();
                    setIsCollapsed(!!data.sidebar_collapsed);
                    setThemeState(data.theme);
                    setColorThemeState(data.color_theme);
                    setTimeRange(data.last_filter_range || 'today');
                    
                    setNextTheme(data.theme);
                    colorThemes.forEach(t => document.documentElement.classList.remove(t.class));
                    document.documentElement.classList.add(data.color_theme);
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error);
            } finally {
                setIsSettingsLoading(false);
            }
        };
        fetchSettings();

        const interval = setInterval(checkSession, 10000);
        return () => clearInterval(interval);

    }, [setNextTheme, checkSession]);

    const updateSetting = useCallback(async (newSetting: object) => {
        try {
            await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSetting),
            });
        } catch (error) {
            console.error("Failed to update setting:", error);
        }
    }, []);
    
    const updateTimeRange = (range: string) => {
        setTimeRange(range);
        updateSetting({ last_filter_range: range });
    };

    const updateSidebarState = (collapsed: boolean) => {
        setIsCollapsed(collapsed);
        updateSetting({ sidebar_collapsed: collapsed });
    };

    const updateTheme = (newTheme: 'light' | 'dark' | 'system') => {
        setThemeState(newTheme);
        setNextTheme(newTheme);
        updateSetting({ theme: newTheme });
    };

    const updateColorTheme = (colorClass: string) => {
        setColorThemeState(colorClass);
        colorThemes.forEach(t => document.documentElement.classList.remove(t.class));
        document.documentElement.classList.add(colorClass);
        updateSetting({ color_theme: colorClass });
    };
    
    const value = {
        isCollapsed, theme, colorTheme, timeRange,
        updateSidebarState, updateTheme, updateColorTheme, updateTimeRange,
        isSettingsLoading,
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
            <AlertDialog open={showSessionExpiredDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Session หมดอายุ</AlertDialogTitle>
                        <AlertDialogDescription>
                            มีการเข้าสู่ระบบจากอุปกรณ์อื่น หรือ Session ของคุณหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => signOut({ callbackUrl: '/' })}>
                            ตกลง
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}