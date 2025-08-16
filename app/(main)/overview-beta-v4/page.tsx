'use client';

import { useEffect, useState, memo, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import { DateRange } from 'react-day-picker';
import { DateRangePickerWithPresets } from '@/components/date-range-picker-with-presets';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { teamGroups, cpmThresholds, costPerDepositThresholds, depositsMonthlyTargets, calculateDailyTarget } from '@/lib/config';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'; // 🟢 เพิ่ม ReferenceLine

// --- Interfaces and Helper Functions ---
const formatNumber = (value: number | string, options: Intl.NumberFormatOptions = {}): string => {
    const num = Number(value);
    if (isNaN(num)) { return typeof value === 'string' ? '0' : '0'; }
    return num.toLocaleString('en-US', options);
};
interface DailyDataPoint { date: string; value: number; }
interface TeamMetric { team_name: string; total_inquiries: number; planned_inquiries: number; actual_spend: number; planned_daily_spend: number; net_inquiries: number; deposits_count: number; cpm_cost_per_inquiry: number; cost_per_deposit: number; new_player_value_thb: number; one_dollar_per_cover: number; cpm_cost_per_inquiry_daily: DailyDataPoint[]; cost_per_deposit_daily: DailyDataPoint[]; deposits_count_daily: DailyDataPoint[]; }
interface TransformedChartData { date: string; [key: string]: any; }

const teamColors: { [key: string]: string } = {
    'สาวอ้อย': '#3b82f6', 'อลิน': '#22c55e', 'อัญญา C': '#14b8a6', 'อัญญา D': '#8b5cf6',
    'Spezbar': '#f97316', 'Barlance': '#ef4444', 'Football Area': '#f59e0b', 'Football Area(Haru)': '#d946ef',
};
const mainTeams = Object.values(teamGroups).flat();

// --- Components ย่อยสำหรับแสดงผล ---
const ProgressCell = memo(({ value, total, isCurrency = false }: { value: number; total: number; isCurrency?: boolean }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    let progressBarColor = 'bg-primary';
    if (isCurrency) {
        if (percentage > 150) progressBarColor = 'bg-red-500/80';
        else if (percentage > 100) progressBarColor = 'bg-yellow-400/80';
        else progressBarColor = 'bg-green-500/80';
    } else {
        if (percentage >= 100) progressBarColor = 'bg-green-500/80';
        else if (percentage >= 80) progressBarColor = 'bg-yellow-400/80';
        else progressBarColor = 'bg-red-500/80';
    }
    const displayValue = isCurrency ? `$${formatNumber(value, { maximumFractionDigits: 0 })}` : formatNumber(value);
    const displayTotal = isCurrency ? `$${formatNumber(total, { maximumFractionDigits: 0 })}` : formatNumber(total);

    return (
        <div className="flex flex-col w-36">
            <div className="flex justify-between items-baseline text-xs">
                <span className="font-semibold">{displayValue} / {displayTotal}</span>
                <span className="font-semibold text-primary">{percentage.toFixed(1)}%</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted mt-1">
                <div className={cn('h-full', progressBarColor)} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
            </div>
        </div>
    );
});

const FinancialMetric = memo(({ value, prefix = '', suffix = '' }: { value: number, prefix?: string, suffix?: string }) => (
    <span className="font-semibold text-sm">
        {prefix}{formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{suffix}
    </span>
));

const CombinedChart = ({ title, data, yAxisLabel, loading, chartType, dateForTarget }: { title: string; data: TransformedChartData[]; yAxisLabel: string; loading: boolean; chartType: 'cpm' | 'costPerDeposit' | 'deposits'; dateForTarget?: Date; }) => {
    const formatYAxis = (tickItem: number) => `${yAxisLabel}${formatNumber(tickItem)}`;
    
    const targets = useMemo(() => {
        const targetMap = new Map<string, number>();
        mainTeams.forEach(teamName => {
            if (chartType === 'cpm') {
                targetMap.set(teamName, cpmThresholds[teamName] || 0);
            } else if (chartType === 'costPerDeposit') {
                targetMap.set(teamName, costPerDepositThresholds[teamName] || 0);
            } else if (chartType === 'deposits' && dateForTarget) {
                const monthlyTarget = depositsMonthlyTargets[teamName] || 0;
                targetMap.set(teamName, calculateDailyTarget(monthlyTarget, dayjs(dateForTarget).format('YYYY-MM-DD')));
            }
        });
        return targetMap;
    }, [chartType, dateForTarget]);

    if (loading) { return <Skeleton className="w-full h-[400px]" />; }

    return (
        <Card>
            <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
            <CardContent className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 30, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                        <XAxis dataKey="date" tickFormatter={(date) => dayjs(date).format('DD')} tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                            formatter={(value: number, name: string) => [`${yAxisLabel}${formatNumber(value, { maximumFractionDigits: 2 })}`, name]}
                            labelFormatter={(label) => dayjs(label).format('D MMMM YYYY')}
                        />
                        <Legend />
                        
                        {/* --- 🟢 ส่วนที่แก้ไข: วาดเส้นข้อมูลจริง --- */}
                        {mainTeams.map(teamName => (
                            <Line key={teamName} type="monotone" dataKey={teamName} stroke={teamColors[teamName] || '#8884d8'} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 6 }} />
                        ))}
                        
                        {/* --- 🟢 ส่วนที่แก้ไข: วาดเส้นเป้าหมาย (ReferenceLine) --- */}
                        {Array.from(targets.entries()).map(([teamName, targetValue]) => {
                            if (targetValue > 0) {
                                return (
                                    <ReferenceLine
                                        key={`${teamName}-target`}
                                        y={targetValue}
                                        stroke={teamColors[teamName] || '#8884d8'}
                                        strokeDasharray="4 4"
                                        strokeWidth={1.5}
                                    />
                                );
                            }
                            return null;
                        })}
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default function OverviewBetaV4Page() {
    const [tableData, setTableData] = useState<TeamMetric[]>([]);
    const [graphRawData, setGraphRawData] = useState<TeamMetric[]>([]);
    const [loadingTable, setLoadingTable] = useState(true);
    const [loadingGraph, setLoadingGraph] = useState(true);
    const [error, setError] = useState('');
    
    const [cpmChartData, setCpmChartData] = useState<TransformedChartData[]>([]);
    const [costPerDepositChartData, setCostPerDepositChartData] = useState<TransformedChartData[]>([]);
    const [depositsChartData, setDepositsChartData] = useState<TransformedChartData[]>([]);
    
    const [tableDateRange, setTableDateRange] = useState<DateRange | undefined>(() => {
        return { from: dayjs().startOf('month').toDate(), to: dayjs().endOf('day').toDate() };
    });
    const [graphDateRange, setGraphDateRange] = useState<DateRange | undefined>(() => {
        return { from: dayjs().startOf('month').toDate(), to: dayjs().endOf('day').toDate() };
    });

    const fetchData = useCallback(async (
        dateRange: DateRange | undefined, 
        setData: React.Dispatch<React.SetStateAction<TeamMetric[]>>,
        setLoading: React.Dispatch<React.SetStateAction<boolean>>,
        storageKey: string
    ) => {
        setLoading(true);
        setError('');
        if (!dateRange || !dateRange.from || !dateRange.to) { setData([]); setLoading(false); return; }
        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem(storageKey, JSON.stringify({ from: dateRange.from, to: dateRange.to }));
            }
            const res = await fetch(`/api/overview?startDate=${dayjs(dateRange.from).format('YYYY-MM-DD')}&endDate=${dayjs(dateRange.to).format('YYYY-MM-DD')}`);
            if (!res.ok) { throw new Error(`Failed to fetch overview data`); }
            const jsonData: TeamMetric[] = await res.json();
            const filteredData = jsonData.filter(team => mainTeams.includes(team.team_name));
            const sortedData = filteredData.sort((a, b) => mainTeams.indexOf(a.team_name) - mainTeams.indexOf(b.team_name));
            setData(sortedData);
        } catch (err: any) {
            setError(err.message);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(tableDateRange, setTableData, setLoadingTable, 'dateRangeFilterBetaV4Table');
    }, [tableDateRange, fetchData]);

    useEffect(() => {
        fetchData(graphDateRange, setGraphRawData, setLoadingGraph, 'dateRangeFilterBetaV4Graph');
    }, [graphDateRange, fetchData]);

    useEffect(() => {
        if (graphRawData.length > 0) {
            const transformData = (dataKey: keyof TeamMetric) => {
                const dateMap = new Map<string, TransformedChartData>();
                graphRawData.forEach(team => {
                    if (Array.isArray(team[dataKey])) {
                        (team[dataKey] as DailyDataPoint[]).forEach(day => {
                            if (!dateMap.has(day.date)) { dateMap.set(day.date, { date: day.date }); }
                            const entry = dateMap.get(day.date)!;
                            entry[team.team_name] = day.value;
                        });
                    }
                });
                return Array.from(dateMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            };
            setCpmChartData(transformData('cpm_cost_per_inquiry_daily'));
            setCostPerDepositChartData(transformData('cost_per_deposit_daily'));
            setDepositsChartData(transformData('deposits_count_daily'));
        }
    }, [graphRawData]);

    if (error) return <p className="p-6 text-red-500">Error: {error}</p>;

    return (
        <div className="space-y-6 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">ภาพรวมรายทีม (Design v4)</h1>
                    <p className="text-muted-foreground">เปรียบเทียบ KPI และแนวโน้มกราฟของแต่ละทีม</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground mb-1 text-center sm:text-left">ข้อมูลตาราง</p>
                    <DateRangePickerWithPresets initialDateRange={tableDateRange} onDateRangeChange={setTableDateRange} />
                </div>
            </div>

            <Card>
                <CardHeader><CardTitle>ตารางเปรียบเทียบ KPI</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">ทีม</TableHead>
                                <TableHead>ยอดทัก / แผน</TableHead>
                                <TableHead>ใช้จ่าย / แผน</TableHead>
                                <TableHead className="text-right">ยอดทักสุทธิ</TableHead>
                                <TableHead className="text-right">ยอดเติม</TableHead>
                                <TableHead className="text-right">CPM</TableHead>
                                <TableHead className="text-right">ทุน/เติม</TableHead>
                                <TableHead className="text-right">ยอดเล่นใหม่</TableHead>
                                <TableHead className="text-right">1$ / Cover</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loadingTable ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <TableRow key={i}><TableCell colSpan={9}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                                ))
                            ) : (
                                tableData.map((team) => (
                                    <TableRow key={team.team_name}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', Number(team.actual_spend) <= Number(team.planned_daily_spend) ? 'bg-green-500' : 'bg-red-500')}></span>
                                                <span className="font-semibold">{team.team_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell><ProgressCell value={team.total_inquiries} total={team.planned_inquiries} /></TableCell>
                                        <TableCell><ProgressCell value={team.actual_spend} total={team.planned_daily_spend} isCurrency /></TableCell>
                                        <TableCell className="text-right font-semibold">{formatNumber(team.net_inquiries)}</TableCell>
                                        <TableCell className="text-right font-semibold">{formatNumber(team.deposits_count)}</TableCell>
                                        <TableCell className="text-right"><FinancialMetric value={team.cpm_cost_per_inquiry} prefix="$" /></TableCell>
                                        <TableCell className="text-right"><FinancialMetric value={team.cost_per_deposit} prefix="$" /></TableCell>
                                        <TableCell className="text-right"><FinancialMetric value={team.new_player_value_thb} prefix="฿" /></TableCell>
                                        <TableCell className="text-right"><FinancialMetric value={team.one_dollar_per_cover} prefix="$" /></TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            
            <div className="space-y-4">
                 <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-4">
                    <h2 className="text-xl font-bold">เปรียบเทียบกราฟรายทีม</h2>
                    <div>
                        <p className="text-xs text-muted-foreground mb-1 text-center sm:text-right">ข้อมูลกราฟ</p>
                        <DateRangePickerWithPresets initialDateRange={graphDateRange} onDateRangeChange={setGraphDateRange} />
                    </div>
                 </div>
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <CombinedChart title="เปรียบเทียบต้นทุนทัก (CPM)" data={cpmChartData} yAxisLabel="$" loading={loadingGraph} chartType="cpm" />
                    <CombinedChart title="เปรียบเทียบต้นทุนต่อเติม" data={costPerDepositChartData} yAxisLabel="$" loading={loadingGraph} chartType="costPerDeposit" />
                    <CombinedChart title="เปรียบเทียบยอดเติม" data={depositsChartData} yAxisLabel="" loading={loadingGraph} chartType="deposits" dateForTarget={graphDateRange?.from} />
                 </div>
            </div>
        </div>
    );
}