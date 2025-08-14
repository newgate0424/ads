'use client';

import { useEffect, useState, memo, useMemo, useCallback, Fragment } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Chart, SeriesConfig } from '@/components/ui/chart';
import dayjs from 'dayjs';
import { DateRange } from 'react-day-picker';
import { DateRangePickerWithPresets } from '@/components/date-range-picker-with-presets';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
    teamGroups,
    cpmThresholds,
    cpmYAxisMax,
    costPerDepositThresholds,
    costPerDepositYAxisMax,
    depositsMonthlyTargets,
    calculateDailyTarget
} from '@/lib/config';

// --- Interfaces and Helper Functions ---
const formatNumber = (value: number | string, options: Intl.NumberFormatOptions = {}): string => {
    const num = Number(value);
    if (isNaN(num)) { return typeof value === 'string' ? '0' : '0'; }
    return num.toLocaleString('en-US', options);
};
interface DailyDataPoint { date: string; value: number; }
interface TeamMetric { team_name: string; planned_inquiries: number; total_inquiries: number; wasted_inquiries: number; net_inquiries: number; planned_daily_spend: number; actual_spend: number; cpm_cost_per_inquiry: number; facebook_cost_per_inquiry: number; deposits_count: number; inquiries_per_deposit: number; quality_inquiries_per_deposit: number; cost_per_deposit: number; new_player_value_thb: number; one_dollar_per_cover: number; page_blocks_7d: number; page_blocks_30d: number; silent_inquiries: number; repeat_inquiries: number; existing_user_inquiries: number; spam_inquiries: number; blocked_inquiries: number; under_18_inquiries: number; over_50_inquiries: number; foreigner_inquiries: number; cpm_cost_per_inquiry_daily: DailyDataPoint[]; deposits_count_daily: DailyDataPoint[]; cost_per_deposit_daily: DailyDataPoint[]; }

const SubMetricDisplay = memo(({ label, value, total }: { label: string; value: number; total: number }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
        <div className="flex flex-col items-center p-1.5 text-center h-full justify-center rounded-lg bg-muted/50 flex-1">
            <div className="text-[11px] text-muted-foreground whitespace-nowrap">{label}</div>
            <div className="text-sm font-bold">{formatNumber(value)}</div>
            <div className="text-[10px] font-semibold text-primary">({percentage.toFixed(1)}%)</div>
        </div>
    );
});

const ProgressCell = memo(({ label, value, total, isCurrency = false }: { label: string; value: number; total: number; isCurrency?: boolean }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    let progressBarColor = 'bg-primary';
    if (label.includes('ใช้จ่าย')) {
        if (percentage > 150) progressBarColor = 'bg-red-500';
        else if (percentage > 100) progressBarColor = 'bg-yellow-400';
        else progressBarColor = 'bg-green-500';
    } else if (label.includes('ยอดทัก')) {
        if (percentage >= 100) progressBarColor = 'bg-green-500';
        else if (percentage >= 80) progressBarColor = 'bg-yellow-400';
        else progressBarColor = 'bg-red-500';
    }
    const displayValue = isCurrency ? `$${formatNumber(value, { maximumFractionDigits: 2 })}` : formatNumber(value);
    return (
        <div className="flex flex-col w-32">
            <div className="flex justify-between items-baseline text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold">{displayValue}</span>
            </div>
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted mt-1">
                <div className={cn('h-full transition-all duration-500', progressBarColor)} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
            </div>
            <div className="text-right text-xs font-semibold text-primary mt-0.5">{percentage.toFixed(1)}%</div>
        </div>
    );
});

const StackedProgressCell = memo(({ net, wasted, total }: { net: number; wasted: number; total: number }) => {
    const netPercentage = total > 0 ? (net / total) * 100 : 0;
    const wastedPercentage = total > 0 ? (wasted / total) * 100 : 0;
    return (
        <div className="flex flex-col w-36">
            <div className="flex justify-between items-baseline text-xs">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                    <span className="font-semibold">{formatNumber(net)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                     <span className="font-semibold text-orange-500">{formatNumber(wasted)}</span>
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                </div>
            </div>
            <div className="flex w-full h-1.5 rounded-full overflow-hidden bg-muted mt-1">
                <div style={{ width: `${netPercentage}%` }} className="bg-sky-500"></div>
                <div style={{ width: `${wastedPercentage}%` }} className="bg-orange-500"></div>
            </div>
             <div className="flex justify-between items-baseline text-xs mt-0.5">
                <span className="font-semibold text-primary">{netPercentage.toFixed(1)}%</span>
                <span className="font-semibold text-muted-foreground">{wastedPercentage.toFixed(1)}%</span>
            </div>
        </div>
    );
});


const FinancialMetric = memo(({ label, value, prefix = '', suffix = '' }: { label: string, value: number, prefix?: string, suffix?: string }) => (
    <div className="flex flex-col text-right">
        <span className="text-sm font-semibold">{prefix}{formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{suffix}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
    </div>
));

// --- 🟢 ส่วนที่แก้ไข: เปลี่ยน text-right เป็น text-center ---
const BreakdownCell = memo(({ value, total }: { value: number, total: number }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
        <div className="text-center">
            <div className="font-semibold text-sm leading-tight">{formatNumber(value)}</div>
            <div className="text-xs text-muted-foreground leading-tight">({percentage.toFixed(1)}%)</div>
        </div>
    );
});
// --- สิ้นสุดส่วนที่แก้ไข ---

const TeamDataRow = memo(({ team }: { team: TeamMetric }) => {
    const [isOpen, setIsOpen] = useState(false);
    const onTrack = Number(team.actual_spend) <= Number(team.planned_daily_spend);
    const totalWasted = team.silent_inquiries + team.repeat_inquiries + team.existing_user_inquiries + team.spam_inquiries + team.blocked_inquiries + team.under_18_inquiries + team.over_50_inquiries + team.foreigner_inquiries;
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
        <Fragment>
            <CollapsibleTrigger asChild>
                <TableRow onClick={() => setIsOpen(!isOpen)} className="cursor-pointer hover:bg-muted/80 data-[state=open]:bg-muted/80">
                    <TableCell>
                        <div className="flex items-center gap-3">
                            <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', onTrack ? 'bg-green-500' : 'bg-red-500')}></span>
                            <span className="font-semibold">{team.team_name}</span>
                        </div>
                    </TableCell>
                    <TableCell><ProgressCell label="ยอดทัก" value={team.total_inquiries} total={team.planned_inquiries} /></TableCell>
                    <TableCell><ProgressCell label="ใช้จ่าย" value={team.actual_spend} total={team.planned_daily_spend} isCurrency /></TableCell>
                    <TableCell><StackedProgressCell net={team.net_inquiries} wasted={totalWasted} total={team.total_inquiries} /></TableCell>
                    <TableCell><FinancialMetric label="CPM" value={team.cpm_cost_per_inquiry} prefix="$" /></TableCell>
                    <TableCell><FinancialMetric label="ทุน/เติม" value={team.cost_per_deposit} prefix="$" /></TableCell>
                    <TableCell><FinancialMetric label="ยอดเติม" value={team.deposits_count} /></TableCell>
                    <TableCell><BreakdownCell value={team.silent_inquiries} total={team.total_inquiries} /></TableCell>
                    <TableCell><BreakdownCell value={team.repeat_inquiries} total={team.total_inquiries} /></TableCell>
                    <TableCell><BreakdownCell value={team.existing_user_inquiries} total={team.total_inquiries} /></TableCell>
                    <TableCell><BreakdownCell value={team.spam_inquiries} total={team.total_inquiries} /></TableCell>
                    <TableCell><BreakdownCell value={team.blocked_inquiries} total={team.total_inquiries} /></TableCell>
                    <TableCell><BreakdownCell value={team.under_18_inquiries} total={team.total_inquiries} /></TableCell>
                    <TableCell><BreakdownCell value={team.over_50_inquiries} total={team.total_inquiries} /></TableCell>
                    <TableCell><BreakdownCell value={team.foreigner_inquiries} total={team.total_inquiries} /></TableCell>
                    <TableCell>
                        <div className="flex items-center justify-end">
                            {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        </div>
                    </TableCell>
                </TableRow>
            </CollapsibleTrigger>
            <CollapsibleContent asChild>
                <TableRow>
                    <TableCell colSpan={16} className="p-0">
                        <div className="bg-muted/30 p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader><CardTitle className="text-base">แนวโน้มการเงินรายวัน</CardTitle></CardHeader>
                                <CardContent className="pt-6">
                                    {financialChartData.length > 0 ? <Chart data={financialChartData} lines={financialChartLines} /> : <div className="text-center text-sm text-muted-foreground h-[210px] flex items-center justify-center">ไม่มีข้อมูล</div>}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle className="text-base">แนวโน้ม CPM รายวัน</CardTitle></CardHeader>
                                    <CardContent className="pt-6">
                                    {cpmChartData.length > 0 ? <Chart data={cpmChartData} lines={cpmChartLine} /> : <div className="text-center text-sm text-muted-foreground h-[210px] flex items-center justify-center">ไม่มีข้อมูล</div>}
                                </CardContent>
                            </Card>
                        </div>
                    </TableCell>
                </TableRow>
            </CollapsibleContent>
        </Fragment>
    );
});


export default function OverviewBetaV2Page() {
    const [allTeamData, setAllTeamData] = useState<TeamMetric[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        if (typeof window !== 'undefined') {
            const savedDateRange = localStorage.getItem('dateRangeFilterBetaV2');
            if (savedDateRange) {
                try {
                    const parsedRange = JSON.parse(savedDateRange);
                    if (parsedRange.from && parsedRange.to) {
                        return { from: dayjs(parsedRange.from).toDate(), to: dayjs(parsedRange.to).toDate() };
                    }
                } catch (e) { console.error("Failed to parse saved date range:", e); }
            }
        }
        return { from: dayjs().startOf('day').toDate(), to: dayjs().endOf('day').toDate() };
    });

    const fetchData = useCallback(async () => {
        setError('');
        if (!dateRange || !dateRange.from || !dateRange.to) {
            setAllTeamData([]);
            setLoading(false);
            return;
        }
        try {
            localStorage.setItem('dateRangeFilterBetaV2', JSON.stringify({ from: dateRange.from, to: dateRange.to }));
            const formattedFrom = dayjs(dateRange.from).format('YYYY-MM-DD');
            const formattedTo = dayjs(dateRange.to).format('YYYY-MM-DD');
            const res = await fetch(`/api/overview?startDate=${formattedFrom}&endDate=${formattedTo}`);
            if (!res.ok) { throw new Error(`Failed to fetch overview data: ${res.statusText}`); }
            const jsonData: TeamMetric[] = await res.json();
            const teamOrderFromGroups = Object.values(teamGroups).flat();
            const sortedData = jsonData.sort((a, b) => teamOrderFromGroups.indexOf(a.team_name) - teamOrderFromGroups.indexOf(b.team_name));
            setAllTeamData(sortedData);
        } catch (err: any) {
            setError(`Error fetching data: ${err.message}`);
            setAllTeamData([]);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => { setLoading(true); fetchData(); }, [fetchData]);
    useEffect(() => { const intervalId = setInterval(fetchData, 30000); return () => { clearInterval(intervalId); }; }, [fetchData]);

    if (error) return <p className="p-6 text-red-500">Error: {error}</p>;
    if (loading || !dateRange) return <div className="p-5"><Skeleton className="h-[600px] w-full" /></div>;

    return (
        <div className="space-y-4 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">ภาพรวมรายทีม (Beta v2)</h1>
                    <p className="text-muted-foreground">คลิกที่แต่ละแถวเพื่อดูรายละเอียดกราฟรายวัน</p>
                </div>
                <DateRangePickerWithPresets initialDateRange={dateRange} onDateRangeChange={setDateRange} />
            </div>
            <div className="space-y-8">
                {Object.entries(teamGroups).map(([groupName, teamNames]) => {
                    const teamsInGroup = allTeamData.filter((team) => teamNames.includes(team.team_name));
                    if (teamsInGroup.length === 0 && !loading) return null;
                    return (
                        <div key={groupName}>
                            <h2 className="text-xl font-bold mb-3">{groupName}</h2>
                            <Card>
                                <div className="overflow-x-auto"> {/* 🟢 เพิ่ม div นี้เพื่อรองรับการ scroll แนวนอน */}
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[180px] sticky left-0 bg-background z-10">ทีม</TableHead>
                                                <TableHead>ยอดทัก / แผน</TableHead>
                                                <TableHead>ใช้จ่าย / แผน</TableHead>
                                                <TableHead>ยอดทักสุทธิ / เสีย</TableHead>
                                                <TableHead className="text-right">CPM</TableHead>
                                                <TableHead className="text-right">ทุน/เติม</TableHead>
                                                <TableHead className="text-right">ยอดเติม</TableHead>
                                                {/* --- 🟢 ส่วนที่แก้ไข: เพิ่ม className="text-center" และกำหนดความกว้าง --- */}
                                                <TableHead className="text-center min-w-[70px]">ทักเงียบ</TableHead>
                                                <TableHead className="text-center min-w-[70px]">ทักซ้ำ</TableHead>
                                                <TableHead className="text-center min-w-[70px]">มียูส</TableHead>
                                                <TableHead className="text-center min-w-[70px]">ก่อกวน</TableHead>
                                                <TableHead className="text-center min-w-[70px]">บล็อก</TableHead>
                                                <TableHead className="text-center min-w-[70px]">ต่ำกว่า18</TableHead>
                                                <TableHead className="text-center min-w-[70px]">อายุเกิน50</TableHead>
                                                <TableHead className="text-center min-w-[70px]">ต่างชาติ</TableHead>
                                                {/* --- สิ้นสุดส่วนที่แก้ไข --- */}
                                                <TableHead className="w-[50px] sticky right-0 bg-background z-10"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                 Array.from({ length: teamNames.length }).map((_, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell colSpan={16}><Skeleton className="h-12 w-full" /></TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                teamsInGroup.map((team) => (
                                                    <Collapsible asChild key={team.team_name}>
                                                        <TeamDataRow team={team} />
                                                    </Collapsible>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}