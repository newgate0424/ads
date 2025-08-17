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
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Label } from 'recharts';

// --- Interfaces and Helper Functions ---
const formatNumber = (value: number | string, options: Intl.NumberFormatOptions = {}): string => {
    const num = Number(value);
    if (isNaN(num)) { return '0'; }
    return num.toLocaleString('en-US', options);
};

interface DailyDataPoint { date: string; value: number; }
interface TeamMetric { team_name: string; total_inquiries: number; planned_inquiries: number; actual_spend: number; planned_daily_spend: number; net_inquiries: number; wasted_inquiries: number; deposits_count: number; cpm_cost_per_inquiry: number; cost_per_deposit: number; new_player_value_thb: number; one_dollar_per_cover: number; cpm_cost_per_inquiry_daily: DailyDataPoint[]; cost_per_deposit_daily: DailyDataPoint[]; deposits_count_daily: DailyDataPoint[]; silent_inquiries: number; repeat_inquiries: number; existing_user_inquiries: number; spam_inquiries: number; blocked_inquiries: number; under_18_inquiries: number; over_50_inquiries: number; foreigner_inquiries: number; }
interface TransformedChartData { date: string; [key: string]: any; }

const teamColors: { [key: string]: string } = {
    'สาวอ้อย': '#3b82f6', 'อลิน': '#16a34a', 'อัญญา C': '#db2777', 'อัญญา D': '#f78c00ff',
    'Spezbar': '#5f6669ff', 'Barlance': '#dc266cff', 'Football Area': '#f59e0b', 'Football Area(Haru)': '#0181a1ff',
};

const groupYAxisMax: { [key: string]: { cpm: number; costPerDeposit: number; } } = {
    'Lotto': { cpm: 2.5, costPerDeposit: 35 },
    'Bacarat': { cpm: 4.5, costPerDeposit: 80 },
    'Football': { cpm: 6.5, costPerDeposit: 120 },
};

// --- Sub-components for display ---
const ProgressCell = memo(({ value, total, isCurrency = false }: { value: number; total: number; isCurrency?: boolean }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    let progressBarColor: string;
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
            <div className="flex justify-between items-baseline text-sm">
                <span className="font-semibold">{displayValue} / {displayTotal}</span>
                <span className="font-semibold text-primary">{percentage.toFixed(1)}%</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted mt-1">
                <div className={cn('h-full', progressBarColor)} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
            </div>
        </div>
    );
});

const StackedProgressCell = memo(({ net, wasted, total }: { net: number; wasted: number; total: number }) => {
    const netPercentage = total > 0 ? (net / total) * 100 : 0;
    const wastedPercentage = total > 0 ? (wasted / total) * 100 : 0;
    return (
        <div className="flex flex-col w-36">
            <div className="flex justify-between items-baseline text-sm">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                    <span className="font-semibold">{formatNumber(net)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-orange-500">{formatNumber(wasted)}</span>
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                </div>
            </div>
            <div className="flex w-full h-2 rounded-full overflow-hidden bg-muted mt-1">
                <div style={{ width: `${netPercentage}%` }} className="bg-sky-500"></div>
                <div style={{ width: `${wastedPercentage}%` }} className="bg-orange-500"></div>
            </div>
            <div className="flex justify-between items-baseline text-sm mt-0.5">
                <span className="font-semibold text-primary">{netPercentage.toFixed(1)}%</span>
                <span className="font-semibold text-muted-foreground">{wastedPercentage.toFixed(1)}%</span>
            </div>
        </div>
    );
});

const FinancialMetric = memo(({ value, prefix = '', suffix = '' }: { value: number, prefix?: string, suffix?: string }) => (
    <span className="font-semibold text-sm">
        {prefix}{formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{suffix}
    </span>
));

const BreakdownCell = memo(({ value, total }: { value: number, total: number }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
        <div className="text-center">
            <div className="font-semibold text-sm leading-tight">{formatNumber(value)}</div>
            <div className="text-xs text-muted-foreground leading-tight">({percentage.toFixed(1)}%)</div>
        </div>
    );
});

const GroupedChart = ({ title, data, yAxisLabel, loading, teamsToShow, chartType, dateForTarget, yAxisDomainMax }: { title: string; data: TransformedChartData[]; yAxisLabel: string; loading: boolean; teamsToShow: string[]; chartType: 'cpm' | 'costPerDeposit' | 'deposits'; dateForTarget?: Date; yAxisDomainMax?: number; }) => {
    const formatYAxis = (tickItem: number) => `${yAxisLabel}${tickItem.toFixed(1)}`;
    
    const targets = useMemo(() => {
        const targetMap = new Map<string, number>();
        teamsToShow.forEach(teamName => {
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
    }, [chartType, dateForTarget, teamsToShow]);
    
    if (loading) { return <Skeleton className="w-full h-[250px]" />; }

    return (
        <Card>
            <CardHeader className="py-4"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
            <CardContent className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 30, left: -10, bottom: 20 }}>
                        <XAxis dataKey="date" tickFormatter={(date) => dayjs(date).format('DD')} tick={{ fontSize: 10 }} />
                        <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 10 }} domain={[0, yAxisDomainMax || 'auto']} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                            formatter={(value: number, name: string) => [`${yAxisLabel}${formatNumber(value, { maximumFractionDigits: 2 })}`, name]}
                            labelFormatter={(label) => dayjs(label).format('D MMMM YYYY')}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
                        
                        {teamsToShow.map(teamName => (
                            <Line key={teamName} type="monotone" dataKey={teamName} stroke={teamColors[teamName] || '#8884d8'} strokeWidth={1.5} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                        ))}
                        
                        {Array.from(targets.entries()).map(([teamName, targetValue]) => {
                            if (targetValue > 0) {
                                return (
                                    <ReferenceLine key={`${teamName}-target`} y={targetValue} stroke={teamColors[teamName] || '#8884d8'} strokeDasharray="4 4" strokeWidth={1}>
                                        <Label value={formatNumber(targetValue, {maximumFractionDigits: 2})} position="right" fill={teamColors[teamName] || '#8884d8'} fontSize={10} />
                                    </ReferenceLine>
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

export default function OverviewBetaV6Page() {
    const [tableData, setTableData] = useState<TeamMetric[]>([]);
    const [graphRawData, setGraphRawData] = useState<TeamMetric[]>([]);
    const [loadingTable, setLoadingTable] = useState(true);
    const [loadingGraph, setLoadingGraph] = useState(true);
    const [error, setError] = useState('');
    const [chartData, setChartData] = useState<{cpm: TransformedChartData[], costPerDeposit: TransformedChartData[], deposits: TransformedChartData[]}>({cpm: [], costPerDeposit: [], deposits: []});
    const [tableDateRange, setTableDateRange] = useState<DateRange | undefined>(undefined);
    const [graphDateRange, setGraphDateRange] = useState<DateRange | undefined>(undefined);

    const fetchOverviewData = useCallback(async (
        dateRange: DateRange | undefined,
        setData: React.Dispatch<React.SetStateAction<TeamMetric[]>>,
        setLoading: React.Dispatch<React.SetStateAction<boolean>>,
        storageKey: string,
        showLoading: boolean // Parameter to control loading state
    ) => {
        if (showLoading) {
            setLoading(true);
        }
        setError('');
        if (!dateRange || !dateRange.from || !dateRange.to) {
            setData([]);
            if (showLoading) {
                setLoading(false);
            }
            return;
        }
        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem(storageKey, JSON.stringify({ from: dateRange.from, to: dateRange.to }));
            }
            const res = await fetch(`/api/overview?startDate=${dayjs(dateRange.from).format('YYYY-MM-DD')}&endDate=${dayjs(dateRange.to).format('YYYY-MM-DD')}`, {
                cache: 'no-store'
            });
            if (!res.ok) { throw new Error(`Failed to fetch overview data`); }
            const jsonData: TeamMetric[] = await res.json();
            setData(jsonData);
        } catch (err: any) {
            setError(err.message);
            setData([]);
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    }, []);
    
    useEffect(() => {
        const savedTableDate = localStorage.getItem('dateRangeFilterBetaV6Table');
        if (savedTableDate) {
            try {
                const parsed = JSON.parse(savedTableDate);
                setTableDateRange({ from: dayjs(parsed.from).toDate(), to: dayjs(parsed.to).toDate() });
            } catch (e) {
                setTableDateRange({ from: dayjs().startOf('day').toDate(), to: dayjs().endOf('day').toDate() });
            }
        } else {
            setTableDateRange({ from: dayjs().startOf('day').toDate(), to: dayjs().endOf('day').toDate() });
        }

        const savedGraphDate = localStorage.getItem('dateRangeFilterBetaV6Graph');
        if (savedGraphDate) {
            try {
                const parsed = JSON.parse(savedGraphDate);
                setGraphDateRange({ from: dayjs(parsed.from).toDate(), to: dayjs(parsed.to).toDate() });
            } catch (e) {
                setGraphDateRange({ from: dayjs().startOf('month').toDate(), to: dayjs().endOf('day').toDate() });
            }
        } else {
            setGraphDateRange({ from: dayjs().startOf('month').toDate(), to: dayjs().endOf('day').toDate() });
        }
    }, []);

    useEffect(() => {
        if (tableDateRange) {
            // Initial fetch with loading indicator
            fetchOverviewData(tableDateRange, setTableData, setLoadingTable, 'dateRangeFilterBetaV6Table', true);
            // Subsequent fetches without loading indicator
            const intervalId = setInterval(() => {
                fetchOverviewData(tableDateRange, setTableData, setLoadingTable, 'dateRangeFilterBetaV6Table', false);
            }, 30000); // Fetch every 30 seconds
            return () => clearInterval(intervalId); // Cleanup on component unmount
        }
    }, [tableDateRange, fetchOverviewData]);
    
    useEffect(() => {
        if (graphDateRange) {
            // Initial fetch with loading indicator
            fetchOverviewData(graphDateRange, setGraphRawData, setLoadingGraph, 'dateRangeFilterBetaV6Graph', true);
            // Subsequent fetches without loading indicator
            const intervalId = setInterval(() => {
                fetchOverviewData(graphDateRange, setGraphRawData, setLoadingGraph, 'dateRangeFilterBetaV6Graph', false);
            }, 30000); // Fetch every 30 seconds
            return () => clearInterval(intervalId); // Cleanup on component unmount
        }
    }, [graphDateRange, fetchOverviewData]);

    useEffect(() => {
        if (graphRawData.length > 0) {
            const transformData = (dataKey: keyof TeamMetric) => {
                const dateMap = new Map<string, TransformedChartData>();
                graphRawData.forEach(team => {
                    const dailyData = team[dataKey];
                    if (Array.isArray(dailyData)) {
                        (dailyData as DailyDataPoint[]).forEach(day => {
                            if (!dateMap.has(day.date)) {
                                dateMap.set(day.date, { date: day.date });
                            }
                            const entry = dateMap.get(day.date);
                            if (entry) {
                                entry[team.team_name] = day.value;
                            }
                        });
                    }
                });
                return Array.from(dateMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            };
            setChartData({
                cpm: transformData('cpm_cost_per_inquiry_daily'),
                costPerDeposit: transformData('cost_per_deposit_daily'),
                deposits: transformData('deposits_count_daily'),
            });
        } else {
            setChartData({ cpm: [], costPerDeposit: [], deposits: [] });
        }
    }, [graphRawData]);
    
    if (!tableDateRange || !graphDateRange) {
        return (
            <div className="space-y-6 p-4 sm:p-6">
                 <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">ภาพรวมรายทีม</h1>
                    </div>
                </div>
                <Skeleton className="h-screen w-full" />
            </div>
        )
    }

    if (error) return <p className="p-6 text-red-500">Error: {error}</p>;

    return (
        <div className="space-y-6 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">ภาพรวมรายทีม</h1>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <div>
                        <p className="text-xs text-muted-foreground mb-1 text-center sm:text-left">ข้อมูลตาราง</p>
                        <DateRangePickerWithPresets initialDateRange={tableDateRange} onDateRangeChange={setTableDateRange} />
                    </div>
                     <div>
                        <p className="text-xs text-muted-foreground mb-1 text-center sm:text-left">ข้อมูลกราฟ</p>
                        <DateRangePickerWithPresets initialDateRange={graphDateRange} onDateRangeChange={setGraphDateRange} />
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {Object.entries(teamGroups).map(([groupName, teamNames]) => {
                    const teamsInGroup = tableData.filter(team => teamNames.includes(team.team_name));
                    
                    if (loadingTable) {
                        return <Skeleton key={groupName} className="h-96 w-full" />
                    }

                    if (teamsInGroup.length === 0) {
                        return (
                            <Card key={groupName} className="p-4 md:p-6">
                                <h2 className="text-2xl font-bold mb-4">{groupName}</h2>
                                <p className="text-muted-foreground">ไม่มีข้อมูลสำหรับกลุ่มนี้ในช่วงวันที่ที่เลือก</p>
                            </Card>
                        )
                    }

                    const groupMaxValues = groupYAxisMax[groupName as keyof typeof groupYAxisMax];

                    return (
                        <Card key={groupName} className="p-4 md:p-6">
                            <h2 className="text-2xl font-bold mb-4">{groupName}</h2>
                            <div className="space-y-6">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[140px]">ทีม</TableHead>
                                                <TableHead>ยอดทัก / แผน</TableHead>
                                                <TableHead>ใช้จ่าย / แผน</TableHead>
                                                <TableHead>ยอดทักสุทธิ / เสีย</TableHead>
                                                <TableHead className="text-right">CPM</TableHead>
                                                <TableHead className="text-right">ยอดเติม</TableHead>
                                                <TableHead className="text-right">ทุน/เติม</TableHead>
                                                <TableHead className="text-right">ยอดเล่นใหม่</TableHead>
                                                <TableHead className="text-right">1$ / Cover</TableHead>
                                                <TableHead className="text-center min-w-[70px]">ทักเงียบ</TableHead>
                                                <TableHead className="text-center min-w-[70px]">ทักซ้ำ</TableHead>
                                                <TableHead className="text-center min-w-[70px]">มียูส</TableHead>
                                                <TableHead className="text-center min-w-[70px]">ก่อกวน</TableHead>
                                                <TableHead className="text-center min-w-[70px]">บล็อก</TableHead>
                                                <TableHead className="text-center min-w-[70px]">ต่ำกว่า18</TableHead>
                                                <TableHead className="text-center min-w-[70px]">อายุเกิน50</TableHead>
                                                <TableHead className="text-center min-w-[70px]">ต่างชาติ</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {teamsInGroup.map((team) => (
                                                <TableRow key={team.team_name}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', Number(team.actual_spend) <= Number(team.planned_daily_spend) ? 'bg-green-500' : 'bg-red-500')}></span>
                                                            <span className="font-semibold">{team.team_name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell><div className="text-sm"><ProgressCell value={team.total_inquiries} total={team.planned_inquiries} /></div></TableCell>
                                                    <TableCell><div className="text-sm"><ProgressCell value={team.actual_spend} total={team.planned_daily_spend} isCurrency /></div></TableCell>
                                                    <TableCell><div className="text-sm"><StackedProgressCell net={team.net_inquiries} wasted={team.wasted_inquiries} total={team.total_inquiries} /></div></TableCell>
                                                    <TableCell className="text-right"><div className="text-sm"><FinancialMetric value={team.cpm_cost_per_inquiry} prefix="$" /></div></TableCell>
                                                    <TableCell className="text-right font-semibold"><div className="text-sm">{formatNumber(team.deposits_count)}</div></TableCell>
                                                    <TableCell className="text-right"><div className="text-sm"><FinancialMetric value={team.cost_per_deposit} prefix="$" /></div></TableCell>
                                                    <TableCell className="text-right"><div className="text-sm"><FinancialMetric value={team.new_player_value_thb} prefix="฿" /></div></TableCell>
                                                    <TableCell className="text-right"><div className="text-sm"><FinancialMetric value={team.one_dollar_per_cover} prefix="$" /></div></TableCell>
                                                    <TableCell><div className="text-sm"><BreakdownCell value={team.silent_inquiries} total={team.total_inquiries} /></div></TableCell>
                                                    <TableCell><div className="text-sm"><BreakdownCell value={team.repeat_inquiries} total={team.total_inquiries} /></div></TableCell>
                                                    <TableCell><div className="text-sm"><BreakdownCell value={team.existing_user_inquiries} total={team.total_inquiries} /></div></TableCell>
                                                    <TableCell><div className="text-sm"><BreakdownCell value={team.spam_inquiries} total={team.total_inquiries} /></div></TableCell>
                                                    <TableCell><div className="text-sm"><BreakdownCell value={team.blocked_inquiries} total={team.total_inquiries} /></div></TableCell>
                                                    <TableCell><div className="text-sm"><BreakdownCell value={team.under_18_inquiries} total={team.total_inquiries} /></div></TableCell>
                                                    <TableCell><div className="text-sm"><BreakdownCell value={team.over_50_inquiries} total={team.total_inquiries} /></div></TableCell>
                                                    <TableCell><div className="text-sm"><BreakdownCell value={team.foreigner_inquiries} total={team.total_inquiries} /></div></TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                                    <GroupedChart title="ต้นทุนทัก (CPM)" data={chartData.cpm} yAxisLabel="$" loading={loadingGraph} teamsToShow={teamNames} chartType="cpm" yAxisDomainMax={groupMaxValues?.cpm} />
                                    <GroupedChart title="ต้นทุนต่อเติม" data={chartData.costPerDeposit} yAxisLabel="$" loading={loadingGraph} teamsToShow={teamNames} chartType="costPerDeposit" yAxisDomainMax={groupMaxValues?.costPerDeposit} />
                                    <GroupedChart title="เป้ายอดเติม" data={chartData.deposits} yAxisLabel="" loading={loadingGraph} teamsToShow={teamNames} chartType="deposits" dateForTarget={graphDateRange?.from} />
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}