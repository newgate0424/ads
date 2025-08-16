// components/login-form.tsx
'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';

export default function LoginForm() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === 'authenticated') {
            router.replace('/overview');
        }
    }, [status, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await signIn('credentials', {
            redirect: false,
            username,
            password,
        });

        setLoading(false);

        if (result?.ok) {
            router.replace('/overview');
        } else {
            setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        }
    };

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Skeleton className="w-[380px] h-[440px]" />
            </div>
        )
    }

    if (status === 'unauthenticated') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <form onSubmit={handleSubmit}>
                    <Card className="w-[380px]">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl">เข้าสู่ระบบ</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid w-full items-center gap-4">
                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="username">Username</Label>
                                    <Input
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            {error && <p className="text-sm text-red-500">{error}</p>}
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'กำลังโหลด...' : 'เข้าสู่ระบบ'}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        );
    }

    return null;
}