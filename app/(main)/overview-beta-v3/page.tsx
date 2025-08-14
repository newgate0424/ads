'use client';

import { useEffect, useState, memo, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import { DateRange } from 'react-day-picker';
import { DateRangePickerWithPresets } from '@/components/date-range-picker-with-presets';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Chart, SeriesConfig } from '@/components/ui/chart';
import { teamGroups, cpmThresholds, cpmYAxisMax, costPerDepositThresholds, costPerDepositYAxisMax, depositsMonthlyTargets, calculateDailyTarget } from '@/lib/config';

// --- Interfaces and Helper Functions ---
const formatNumber = (value: number | string, options: Intl.NumberFormatOptions = {}): string => {
    const num = Number(value);
    if (isNaN(num)) { return typeof value === 'string' ? '0' : '0'; }
    return num.toLocaleString('en-US', options);
};
interface DailyDataPoint { date: string; value: number; }
interface TeamMetric { team_name: string; total_inquiries: number; planned_inquiries: number; actual_spend: number; planned_daily_spend: number; net_inquiries: number; deposits_count: number; cpm_cost_per_inquiry: number; cost_per_deposit: number; new_player_value_thb: number; one_dollar_per_cover: number; cpm_cost_per_inquiry_daily: DailyDataPoint[]; deposits_count_daily: DailyDataPoint[]; cost_per_deposit_daily: DailyDataPoint[]; }

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

const TeamChartCard = memo(({ team }: { team: TeamMetric }) => {
    // Logic คำนวณ Chart (เหมือนเดิม)
    const financialChartData = useMemo(() => {
        const dataMap = new Map<string, { costPerDeposit?: number; deposits?: number }>();
        team.cost_per_deposit_daily.forEach(point => { dataMap.set(point.date, { ...dataMap.get(point.date), costPerDeposit: point.value }); });
        team.deposits_count_daily.forEach(point => { dataMap.set(point.date, { ...dataMap.get(point.date), deposits: point.value }); });
        return Array.from(dataMap.entries()).map(([date, values]) => ({ date, ...values })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [team.cost_per_deposit_daily, team.deposits_count_daily]);
    const cpmChartData = useMemo(() => team.cpm_cost_per_inquiry_daily, [team.cpm_cost_per_inquiry_daily]);
    const costPerDepositThreshold = costPerDepositThresholds[team.team_name] ?? 0;
    const costPerDepositYAxisMaxVal = costPerDepositYAxisMax[team.team_name] ?? 100;
    let depositsDailyTarget = 0;
    if (team.deposits_count_daily && team.deposits_count_daily.length > 0) {
        const monthlyTarget = depositsMonthlyTargets[team.team_name] ?? 0;
        if (monthlyTarget) depositsDailyTarget = calculateDailyTarget(monthlyTarget, team.deposits_count_daily[0].date);
    }
     const financialChartLines: SeriesConfig[] = [
        { dataKey: 'costPerDeposit', name: 'ทุน/เติม', color: '#c2410c', threshold: costPerDepositThreshold, yAxisId: 'left', yAxisMax: costPerDepositYAxisMaxVal },
        { dataKey: 'deposits', name: 'ยอดเติม', color: '#059669', type: 'bar', threshold: depositsDailyTarget, yAxisId: 'right', yAxisMax: 150 }
    ];
    const cpmChartLine: SeriesConfig[] = [ { dataKey: 'value', name: 'CPM', color: '#1e40af', threshold: cpmThresholds[team.team_name] ?? 0, yAxisId: 'left', yAxisMax: cpmYAxisMax[team.team_name] ?? 100 }];

    return (
        <Card>
            <CardHeader>
                <CardTitle>{team.team_name}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2 text-center">ทุน/เติม และ ยอดเติม</h4>
                    {financialChartData.length > 0 ? <Chart data={financialChartData} lines={financialChartLines} /> : <div className="text-center text-sm text-muted-foreground h-[210px] flex items-center justify-center">ไม่มีข้อมูล</div>}
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2 text-center">CPM</h4>
                    {cpmChartData.length > 0 ? <Chart data={cpmChartData} lines={cpmChartLine} /> : <div className="text-center text-sm text-muted-foreground h-[210px] flex items-center justify-center">ไม่มีข้อมูล</div>}
                </div>
            </CardContent>
        </Card>
    )
})


// --- Component หลักของหน้า ---
export default function OverviewBetaV3Page() {
    const [allTeamData, setAllTeamData] = useState<TeamMetric[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        if (typeof window !== 'undefined') {
            const savedDateRange = localStorage.getItem('dateRangeFilterBetaV3');
            if (savedDateRange) {
                try {
                    const parsedRange = JSON.parse(savedDateRange);
                    if (parsedRange.from && parsedRange.to) { return { from: dayjs(parsedRange.from).toDate(), to: dayjs(parsedRange.to).toDate() }; }
                } catch (e) { console.error("Failed to parse saved date range:", e); }
            }
        }
        return { from: dayjs().startOf('month').toDate(), to: dayjs().endOf('day').toDate() };
    });

    const fetchData = useCallback(async () => {
        setError('');
        if (!dateRange || !dateRange.from || !dateRange.to) { setAllTeamData([]); setLoading(false); return; }
        try {
            localStorage.setItem('dateRangeFilterBetaV3', JSON.stringify({ from: dateRange.from, to: dateRange.to }));
            const res = await fetch(`/api/overview?startDate=${dayjs(dateRange.from).format('YYYY-MM-DD')}&endDate=${dayjs(dateRange.to).format('YYYY-MM-DD')}`);
            if (!res.ok) { throw new Error(`Failed to fetch overview data: ${res.statusText}`); }
            const jsonData: TeamMetric[] = await res.json();
            const mainTeams = Object.values(teamGroups).flat();
            const filteredData = jsonData.filter(team => mainTeams.includes(team.team_name));
            const sortedData = filteredData.sort((a, b) => mainTeams.indexOf(a.team_name) - mainTeams.indexOf(b.team_name));
            setAllTeamData(sortedData);
        } catch (err: any) {
            setError(`Error fetching data: ${err.message}`);
            setAllTeamData([]);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => { setLoading(true); fetchData(); }, [fetchData]);

    if (error) return <p className="p-6 text-red-500">Error: {error}</p>;

    return (
        <div className="space-y-6 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">ภาพรวมรายทีม (Design v3)</h1>
                    <p className="text-muted-foreground">เปรียบเทียบ KPI หลักและแนวโน้มกราฟของแต่ละทีม</p>
                </div>
                <DateRangePickerWithPresets initialDateRange={dateRange} onDateRangeChange={setDateRange} />
            </div>

            {/* --- โซนที่ 1: ตารางเปรียบเทียบ --- */}
            <Card>
                <CardHeader>
                    <CardTitle>ตารางเปรียบเทียบ KPI</CardTitle>
                </CardHeader>
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
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={9}><Skeleton className="h-10 w-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                allTeamData.map((team) => (
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
            
            {/* --- โซนที่ 2: เปรียบเทียบกราฟ --- */}
            <div>
                 <h2 className="text-xl font-bold mb-3">เปรียบเทียบกราฟรายทีม</h2>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {loading ? (
                        Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-80 w-full" />)
                    ) : (
                        allTeamData.map((team) => (
                           <TeamChartCard key={team.team_name} team={team} />
                        ))
                    )}
                 </div>
            </div>

        </div>
    );
}