'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Wifi, ListChecks } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/th';

dayjs.extend(relativeTime);
dayjs.locale('th');

interface User {
  username: string;
  last_seen: string | null;
}
interface ActivityLog {
  username: string;
  action: string;
  created_at: string;
}
interface UserData {
  allUsers: User[];
  activityLogs: ActivityLog[];
}

const StatusBadge = ({ lastSeen }: { lastSeen: string | null }) => {
    if (!lastSeen) {
        return <Badge variant="secondary">ไม่เคยออนไลน์</Badge>;
    }
    
    const now = dayjs();
    const lastSeenTime = dayjs(lastSeen);
    const diffInMinutes = now.diff(lastSeenTime, 'minute');

    if (diffInMinutes < 2) {
        return (
            <div className="flex items-center gap-2">
                <Badge className="bg-green-500 hover:bg-green-600">ออนไลน์</Badge>
                <span className="text-xs text-muted-foreground">ตอนนี้</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Badge variant="outline">ออฟไลน์</Badge>
            <span className="text-xs text-muted-foreground">{lastSeenTime.fromNow()}</span>
        </div>
    );
};


export default function AdminPage() {
    const [data, setData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/admin/users');
                if (!res.ok) throw new Error('Failed to fetch user data');
                const jsonData = await res.json();
                setData(jsonData);
            } catch (err: any) {
                if (loading) setError(err.message); 
            } finally {
                if (loading) setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [loading]);

    const onlineUsersCount = data && data.allUsers 
        ? data.allUsers.filter(u => u.last_seen && dayjs().diff(dayjs(u.last_seen), 'minute') < 2).length 
        : 0;

    if (error && loading) return <div className="text-red-500 text-center">Error: {error}</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">User Status & Activity</h1>
            
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">ผู้ใช้ทั้งหมด</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{data?.allUsers?.length ?? 0}</div>}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">กำลังออนไลน์</CardTitle>
                        <Wifi className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{onlineUsersCount}</div>}
                    </CardContent>
                </Card>
            </div>


            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>สถานะผู้ใช้</CardTitle>
                        <CardDescription>แสดงสถานะออนไลน์ / ออฟไลน์ของผู้ใช้ทั้งหมด</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {loading ? (
                            <div className="space-y-2 pt-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
                        ) : (
                            <div className="max-h-[400px] overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b hover:bg-transparent">
                                            <TableHead>Username</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data?.allUsers?.map((user) => (
                                            <TableRow key={user.username} className="border-none">
                                                <TableCell className="font-medium">{user.username}</TableCell>
                                                <TableCell><StatusBadge lastSeen={user.last_seen} /></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                     <CardHeader>
                        <CardTitle>ประวัติการใช้งานล่าสุด</CardTitle>
                        <CardDescription>แสดง 50 รายการล่าสุด</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {loading ? (
                            <div className="space-y-2 pt-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
                        ) : (
                            <div className="max-h-[400px] overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b hover:bg-transparent">
                                            <TableHead>ผู้ใช้</TableHead>
                                            <TableHead>การกระทำ</TableHead>
                                            <TableHead>เวลา</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data?.activityLogs?.map((log, index) => (
                                            <TableRow key={index} className="border-none">
                                                <TableCell className="font-medium">{log.username}</TableCell>
                                                <TableCell>{log.action === 'login' ? 'เข้าสู่ระบบ' : 'เปลี่ยนรหัสผ่าน'}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{dayjs(log.created_at).format('YYYY-MM-DD HH:mm')}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}