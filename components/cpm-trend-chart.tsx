// file: components/cpm-trend-chart.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ChartData {
    date: string;
    cpm: number;
}

interface CpmTrendChartProps {
    data: ChartData[];
    loading: boolean;
}

export function CpmTrendChart({ data, loading }: CpmTrendChartProps) {

    const formatXAxis = (tickItem: string) => {
        // แสดงวันที่แบบย่อ เช่น 06/08
        const date = new Date(tickItem);
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
    };
    
    const formatTooltipLabel = (label: string) => {
        // แสดงวันที่แบบเต็มใน Tooltip
        const date = new Date(label);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>แนวโน้มต้นทุนทัก (CPM)</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                </CardContent>
            </Card>
        );
    }
    
    if (data.length === 0) {
        return (
            <Card>
                 <CardHeader>
                    <CardTitle>แนวโน้มต้นทุนทัก (CPM)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        ไม่มีข้อมูลสำหรับช่วงเวลาที่เลือก
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>แนวโน้มต้นทุนทัก (CPM)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatXAxis}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                                tick={{ fontSize: 12 }}
                            />
                            <YAxis
                                tickFormatter={(value) => `$${value.toFixed(2)}`}
                                tick={{ fontSize: 12 }}
                                domain={['dataMin - 5', 'dataMax + 5']}
                            />
                            <Tooltip
                                contentStyle={{ 
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))'
                                }}
                                labelFormatter={formatTooltipLabel}
                                formatter={(value: number) => [`$${value.toFixed(2)}`, "ต้นทุนทัก CPM"]}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="cpm"
                                name="ต้นทุนทัก CPM"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}