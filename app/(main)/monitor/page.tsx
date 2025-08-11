// app/(main)/monitor/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Database, DollarSign, Calendar } from 'lucide-react';

interface MonitorData {
    totalUsers: number;
    totalSalesRecords: number;
    totalRevenue: number;
    lastSaleDate: string;
}

export default function MonitorPage() {
    const [data, setData] = useState<MonitorData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/monitor');
                if (!res.ok) {
                    throw new Error('Failed to fetch monitor data');
                }
                const jsonData = await res.json();
                setData(jsonData);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (error) return <div className="text-red-500 text-center">Error: {error}</div>;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Monitor</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Users Card */}
                <Card className="border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{data?.totalUsers}</div>}
                    </CardContent>
                </Card>

                {/* Total Sales Records Card */}
                <Card className="border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sales Records</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                         {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{data?.totalSalesRecords}</div>}
                    </CardContent>
                </Card>

                {/* Total Revenue Card */}
                <Card className="border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                         {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">${Number(data?.totalRevenue || 0).toFixed(2)}</div>}
                    </CardContent>
                </Card>

                {/* Last Sale Date Card */}
                <Card className="border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Last Data Sync</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                         {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-xl font-bold">{data?.lastSaleDate ? new Date(data.lastSaleDate).toLocaleDateString() : 'N/A'}</div>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}