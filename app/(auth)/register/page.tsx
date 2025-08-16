'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from 'next/link';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        if (password.length < 4) {
            setError('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess('สมัครสมาชิกสำเร็จ! กำลังไปหน้าล็อกอิน...');
                setTimeout(() => {
                    router.push('/');
                }, 2000);
            } else {
                setError(data.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
            }
        } catch (err) {
            setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <Card className="w-[380px]">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">สร้างบัญชีใหม่</CardTitle>
                    <CardDescription>กรอกข้อมูลเพื่อสมัครสมาชิก</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="username">Username</Label>
                                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required disabled={loading} />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
                            </div>
                            {error && <p className="text-sm text-red-500">{error}</p>}
                            {success && <p className="text-sm text-green-500">{success}</p>}
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center text-sm">
                    <p>มีบัญชีอยู่แล้ว?&nbsp;</p>
                    <Link href="/" className="font-semibold underline">
                        เข้าสู่ระบบที่นี่
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}