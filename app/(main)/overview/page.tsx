'use client';

import { useEffect, useState, memo, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Chart, SeriesConfig } from '@/components/ui/chart';
import dayjs from 'dayjs';
import { DateRange } from 'react-day-picker';
import { DateRangePickerWithPresets } from '@/components/date-range-picker-with-presets';
import {
    teamGroups,
    cpmThresholds,
    cpmYAxisMax,
    costPerDepositThresholds,
    costPerDepositYAxisMax,
    depositsMonthlyTargets,
    calculateDailyTarget
} from '@/lib/config';

const formatNumber = (
    value: number | string,
    options: Intl.NumberFormatOptions = {}
): string => {
    const num = Number(value);
    if (isNaN(num)) {
        return typeof value === 'string' ? value : '0';
    }
    return num.toLocaleString('en-US', options);
};

// ... Interfaces ทั้งหมดเหมือนเดิม ...
interface DailyDataPoint { date: string; value: number; }
interface TeamMetric { team_name: string; planned_inquiries: number; total_inquiries: number; wasted_inquiries: number; net_inquiries: number; planned_daily_spend: number; actual_spend: number; cpm_cost_per_inquiry: number; facebook_cost_per_inquiry: number; deposits_count: number; inquiries_per_deposit: number; quality_inquiries_per_deposit: number; cost_per_deposit: number; new_player_value_thb: number; one_dollar_per_cover: number; page_blocks_7d: number; page_blocks_30d: number; silent_inquiries: number; repeat_inquiries: number; existing_user_inquiries: number; spam_inquiries: number; blocked_inquiries: number; under_18_inquiries: number; over_50_inquiries: number; foreigner_inquiries: number; cpm_cost_per_inquiry_daily: DailyDataPoint[]; deposits_count_daily: DailyDataPoint[]; cost_per_deposit_daily: DailyDataPoint[]; }

// ... Sub-components ทั้งหมดเหมือนเดิม ...
const SimpleProgressBar = memo(({ value, indicatorClassName }: { value: number; indicatorClassName: string }) => { const [animatedValue, setAnimatedValue] = useState(0); useEffect(() => { setAnimatedValue(value); }, [value]); return ( <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted"> <div className={cn('h-full transition-all duration-700 ease-in-out', indicatorClassName)} style={{ width: `${animatedValue}%` }}></div> </div> ); });
const SmallCardMetricWrapper = memo(({ children }: { children: React.ReactNode }) => { return ( <div className="flex flex-col p-2 rounded-lg bg-muted/50"> {children} </div> ); });
const CompactMetricDisplay = memo(({ label, value }: { label: string; value: string | number }) => { return ( <div className="flex justify-between items-center text-sm"> <span className="text-muted-foreground">{label}</span> <span className="font-semibold text-right">{value}</span> </div> ); });
const CompactProgressMetric = memo(({ label, value, total, isCurrency = false }: { label: string; value: number; total: number; isCurrency?: boolean }) => { const progressPercentage = total > 0 ? (value / total) * 100 : 0; const displayValue = isCurrency ? `$${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : formatNumber(value); const displayTotal = isCurrency ? `$${formatNumber(total, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : formatNumber(total); let progressBarColor = 'bg-primary'; if (label.includes('แผนใช้จ่าย')) { if (progressPercentage > 150) progressBarColor = 'bg-red-500'; else if (progressPercentage > 100) progressBarColor = 'bg-yellow-400'; else progressBarColor = 'bg-green-500'; } else if (label.includes('ยอดทัก')) { if (progressPercentage >= 100) progressBarColor = 'bg-green-500'; else if (progressPercentage > 80) progressBarColor = 'bg-yellow-400'; else if (progressPercentage > 50) progressBarColor = 'bg-orange-500'; else if (progressPercentage > 20) progressBarColor = 'bg-orange-600'; else progressBarColor = 'bg-red-500'; } return ( <div className="flex flex-col"> <div className="flex justify-between items-baseline text-xs mb-1"> <span className="text-muted-foreground">{label}</span> <span className="font-semibold text-right"> {displayValue} / {displayTotal} </span> </div> <SimpleProgressBar value={progressPercentage} indicatorClassName={progressBarColor} /> <div className="text-right text-xs font-semibold text-primary mt-1"> {progressPercentage.toFixed(1)}% </div> </div> ); });
const CompactStackedProgressBar = memo(({ net, wasted, total }: { net: number; wasted: number; total: number }) => { const netPercentage = total > 0 ? (net / total) * 100 : 0; const wastedPercentage = total > 0 ? (wasted / total) * 100 : 0; return ( <div className="flex flex-col"> <div className="text-xs text-muted-foreground mb-1">ยอดทักบริสุทธิ / ยอดเสีย</div> <div className="flex w-full h-2 rounded-full overflow-hidden bg-muted"> <div style={{ width: `${netPercentage}%` }} className="bg-sky-500 transition-all duration-300"></div> <div style={{ width: `${wastedPercentage}%` }} className="bg-orange-500 transition-all duration-300"></div> </div> <div className="flex justify-between items-baseline text-xs mt-1"> <div className="flex items-center gap-1"> <div className="w-1.5 h-1.5 rounded-full bg-sky-500"></div> <span className="font-semibold">{formatNumber(net)} ({netPercentage.toFixed(1)}%)</span> </div> <div className="flex items-center gap-1"> <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div> <span className="font-semibold">{formatNumber(wasted)} ({wastedPercentage.toFixed(1)}%)</span> </div> </div> </div> ); });
const SubMetricDisplay = memo(({ label, value, total }: { label: string; value: number; total: number }) => { const percentage = total > 0 ? (value / total) * 100 : 0; return ( <div className="flex flex-col items-center p-1 text-center h-full justify-center rounded-lg bg-muted/50"> <div className="text-xs text-muted-foreground whitespace-nowrap">{label}</div> <div className="text-sm font-bold">{formatNumber(value)}</div> <div className="text-[11px] font-semibold text-primary">({percentage.toFixed(1)}%)</div> </div> ); });

const TeamCard = memo(({ team }: { team: TeamMetric }) => {
    const onTrack = Number(team.actual_spend) <= Number(team.planned_daily_spend);
    const totalInquiries = team.total_inquiries;
    const cpmThreshold = cpmThresholds[team.team_name] ?? 0;
    const cpmYAxisMaxVal = cpmYAxisMax[team.team_name] ?? 100;
    const costPerDepositThreshold = costPerDepositThresholds[team.team_name] ?? 0;
    const costPerDepositYAxisMaxVal = costPerDepositYAxisMax[team.team_name] ?? 100;
    let depositsDailyTarget = 0;
    if (team.deposits_count_daily && team.deposits_count_daily.length > 0) {
        const anyDateInMonth = team.deposits_count_daily[0].date;
        const monthlyTarget = depositsMonthlyTargets[team.team_name] ?? 0;
        if (monthlyTarget) {
            depositsDailyTarget = calculateDailyTarget(monthlyTarget, anyDateInMonth);
        }
    }
    const financialChartData = useMemo(() => {
        const dataMap = new Map<string, { costPerDeposit?: number; deposits?: number }>();
        team.cost_per_deposit_daily.forEach(point => {
            if (!dataMap.has(point.date)) dataMap.set(point.date, {});
            dataMap.get(point.date)!.costPerDeposit = point.value;
        });
        team.deposits_count_daily.forEach(point => {
            if (!dataMap.has(point.date)) dataMap.set(point.date, {});
            dataMap.get(point.date)!.deposits = point.value;
        });
        return Array.from(dataMap.entries())
            .map(([date, values]) => ({ date, ...values }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [team.cost_per_deposit_daily, team.deposits_count_daily]);

    // ✅ แก้ไขการตั้งค่ากราฟ "ทุน/เติม และ ยอดเติม"
    const financialChartLines: SeriesConfig[] = [
        { 
            dataKey: 'costPerDeposit', 
            name: 'ทุน/เติม', 
            color: '#c2410c',
            threshold: costPerDepositThreshold, 
            yAxisId: 'left',
            yAxisMax: costPerDepositYAxisMaxVal
        },
        { 
            dataKey: 'deposits', 
            name: 'ยอดเติม', 
            color: '#059669',
            type: 'bar',
            threshold: depositsDailyTarget, // ✅ 4. ใช้ค่าเป้าหมายที่คำนวณไว้
            yAxisId: 'right',
            yAxisMax: 150// ✅ 3. เพิ่มสเกลสูงสุดให้แกน Y ของกราฟแท่ง
        }
    ];

    const cpmChartData = useMemo(() => team.cpm_cost_per_inquiry_daily, [team.cpm_cost_per_inquiry_daily]);
    const cpmChartLine: SeriesConfig[] = [
        { dataKey: 'value', name: 'CPM', color: '#1e40af', threshold: cpmThreshold, yAxisId: 'left', yAxisMax: cpmYAxisMaxVal }
    ];

    return (
        <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center space-x-3 p-3 pb-2">
                <div className={cn('w-2 h-2 rounded-full flex-shrink-0', onTrack ? 'bg-green-500' : 'bg-red-500')}></div>
                <div className="flex-1"><CardTitle className="text-base font-semibold">{team.team_name}</CardTitle></div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
                <div className="space-y-3">
                    <SmallCardMetricWrapper><CompactProgressMetric label="ยอดทัก / แผน" value={team.total_inquiries} total={team.planned_inquiries} /></SmallCardMetricWrapper>
                    <SmallCardMetricWrapper><CompactStackedProgressBar net={team.net_inquiries} wasted={team.wasted_inquiries} total={team.total_inquiries} /></SmallCardMetricWrapper>
                    <SmallCardMetricWrapper><CompactProgressMetric label="แผนใช้จ่าย / ใช้จ่าย" value={Number(team.actual_spend)} total={Number(team.planned_daily_spend)} isCurrency={true} /></SmallCardMetricWrapper>
                </div>
                <Separator className="my-3" />
                <div className="space-y-2">
                    <p className="text-sm font-semibold mb-2 text-muted-foreground">จำแนกยอดทัก</p>
                    <div className="grid grid-cols-4 gap-1.5">
                        <SubMetricDisplay label="ทักเงียบ" value={team.silent_inquiries} total={totalInquiries} /><SubMetricDisplay label="ทักซ้ำ" value={team.repeat_inquiries} total={totalInquiries} /><SubMetricDisplay label="มียูส" value={team.existing_user_inquiries} total={totalInquiries} /><SubMetricDisplay label="ก่อกวน" value={team.spam_inquiries} total={totalInquiries} /><SubMetricDisplay label="บล็อก" value={team.blocked_inquiries} total={totalInquiries} /><SubMetricDisplay label="ต่ำกว่า 18" value={team.under_18_inquiries} total={totalInquiries} /><SubMetricDisplay label="อายุเกิน 50" value={team.over_50_inquiries} total={totalInquiries} /><SubMetricDisplay label="ต่างชาติ" value={team.foreigner_inquiries} total={totalInquiries} />
                    </div>
                </div>
                <Separator className="my-3" />
                <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground">ข้อมูลการเงิน</p>
                    <div className="flex flex-col gap-2">
                        <SmallCardMetricWrapper><CompactMetricDisplay label="ต้นทุนทัก CPM" value={`$${formatNumber(team.cpm_cost_per_inquiry, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} /></SmallCardMetricWrapper>
                        <SmallCardMetricWrapper><CompactMetricDisplay label="เติม" value={formatNumber(team.deposits_count)} /></SmallCardMetricWrapper>
                        <SmallCardMetricWrapper><CompactMetricDisplay label="ทุน/เติม" value={`$${formatNumber(team.cost_per_deposit, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} /></SmallCardMetricWrapper>
                        <SmallCardMetricWrapper><CompactMetricDisplay label="ยอดเล่นใหม่" value={`฿${formatNumber(team.new_player_value_thb, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} /></SmallCardMetricWrapper>
                        <SmallCardMetricWrapper><CompactMetricDisplay label="1$ / Cover" value={`$${formatNumber(team.one_dollar_per_cover, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} /></SmallCardMetricWrapper>
                    </div>
                </div>
                <Separator className="my-3" />
                
                <div className="mt-4 space-y-4">
                    {financialChartData.length > 0 && (
                        <div>
                            <p className="text-sm font-semibold text-muted-foreground mb-2">ทุน/เติม และ ยอดเติมรายวัน</p>
                            <Chart data={financialChartData} lines={financialChartLines} />
                        </div>
                    )}
                    {cpmChartData.length > 0 && (
                        <div>
                            <p className="text-sm font-semibold text-muted-foreground mb-2">CPM รายวัน</p>
                            <Chart data={cpmChartData} lines={cpmChartLine} />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
});


export default function OverviewPage() {
    // ... ส่วนของ Logic หลักไม่มีการเปลี่ยนแปลง ...
    const [allTeamData, setAllTeamData] = useState<TeamMetric[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        if (typeof window !== 'undefined') {
            const savedDateRange = localStorage.getItem('dateRangeFilter');
            if (savedDateRange) {
                try {
                    const parsedRange = JSON.parse(savedDateRange);
                    if (parsedRange.from && parsedRange.to) {
                        return { from: dayjs(parsedRange.from).toDate(), to: dayjs(parsedRange.to).toDate() };
                    }
                } catch (e) { console.error("Failed to parse saved date range:", e); }
            }
        }
        return { from: dayjs().startOf('month').toDate(), to: dayjs().endOf('day').toDate() };
    });
    const fetchData = useCallback(async () => {
        setError('');
        if (!dateRange || !dateRange.from || !dateRange.to) {
            setAllTeamData([]);
            setLoading(false);
            return;
        }
        try {
            localStorage.setItem('dateRangeFilter', JSON.stringify({ from: dateRange.from, to: dateRange.to }));
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
    if (loading || !dateRange) return <Skeleton className="h-screen w-full" />;

    return (
        <div className="space-y-3 p-5">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h1 className="text-3xl font-bold">ภาพรวมรายทีม</h1>
                <div className="flex items-center gap-2">
                    <DateRangePickerWithPresets initialDateRange={dateRange} onDateRangeChange={setDateRange} />
                </div>
            </div>
            <div className="space-y-10">
                {Object.entries(teamGroups).map(([groupName, teamNames]) => {
                    const teamsInGroup = allTeamData
                        .filter((team) => teamNames.includes(team.team_name))
                        .sort((a, b) => teamNames.indexOf(a.team_name) - teamNames.indexOf(b.team_name));
                    if (teamsInGroup.length === 0) return null;
                    return (
                        <div key={groupName} className="space-y-4">
                            <h2 className="text-2xl font-bold border-b pb-2">{groupName}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                                {teamsInGroup.map((team) => (
                                    <TeamCard key={team.team_name} team={team} />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}