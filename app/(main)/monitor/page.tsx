'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { teamGroups } from '@/lib/config';
import dayjs from 'dayjs';
import { DateRange } from 'react-day-picker';
import { DateRangePickerWithPresets } from '@/components/date-range-picker-with-presets';
import { Skeleton } from '@/components/ui/skeleton';

const adserData: { [key: string]: string[] } = {
    'สาวอ้อย': ['Boogey', 'Bubble'],
    'อลิน': ['Lucifer', 'Risa'],
    'อัญญา C': ['Shazam', 'Vivien'],
    'อัญญา D': ['Sim', 'Joanne'],
    'Spezbar': ['Cookie', 'Piea'],
    'Barlance': ['Irene'],
    'Football Area': ['Thomas', 'IU', 'Nolan'],
    'Football Area(Haru)': ['Minho', 'Bailu'],
};

interface AdMetricsRow {
    team_name: string;
    adser: string;
    ad_id: string;
    page_id: string;
    content: string;
    facebook_account: string;
    target_audience: string;
    exclude_audience: string;
    status: string;
    budget: string;
    note: string;
    one_dollar_per_cover: number;
    cpm_cost_per_inquiry: number;
    facebook_cost_per_inquiry: number;
    cost_per_deposit: number;
    total_inquiries: number;
    wasted_inquiries: number;
    net_inquiries: number;
    actual_spend: number;
    registrations: number;
    deposits_count: number;
    new_player_value_thb: number;
    existing_users: number;
    avg_player_value: number;
    silent_inquiries: number;
    repeat_inquiries: number;
    existing_user_inquiries: number;
    spam_inquiries: number;
    blocked_inquiries: number;
    under_18_inquiries: number;
    over_50_inquiries: number;
    foreigner_inquiries: number;
    record_date: Date;
}

const formatNumber = (value: number | string | null, options: Intl.NumberFormatOptions = {}): string => {
    const num = Number(value);
    if (isNaN(num) || value === null) {
        return '-';
    }
    return num.toLocaleString('en-US', options);
};

export default function MonitorPage() {
    const [selectedTeam, setSelectedTeam] = useState<string>('all');
    const [selectedAdser, setSelectedAdser] = useState<string>('all');
    const [availableAdsers, setAvailableAdsers] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: dayjs().startOf('month').toDate(), // <-- ส่วนที่แก้ไข
        to: dayjs().endOf('day').toDate(),
    });
    const [data, setData] = useState<AdMetricsRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (selectedTeam && selectedTeam !== 'all') {
            setAvailableAdsers(adserData[selectedTeam] || []);
        } else {
            const allAdsers = Object.values(adserData).flat();
            setAvailableAdsers([...new Set(allAdsers)]);
        }
        setSelectedAdser('all'); 
    }, [selectedTeam]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');

        if (!dateRange || !dateRange.from || !dateRange.to) {
            setData([]);
            setLoading(false);
            return;
        }

        const formattedStartDate = dayjs(dateRange.from).format('YYYY-MM-DD');
        const formattedEndDate = dayjs(dateRange.to).format('YYYY-MM-DD');

        const params = new URLSearchParams({
            startDate: formattedStartDate,
            endDate: formattedEndDate,
        });

        if (selectedTeam !== 'all') {
            params.append('team', selectedTeam);
        }
        if (selectedAdser !== 'all') {
            params.append('adser', selectedAdser);
        }

        try {
            const res = await fetch(`/api/monitor?${params.toString()}`);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to fetch data');
            }
            const jsonData: AdMetricsRow[] = await res.json();
            setData(jsonData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [selectedTeam, selectedAdser, dateRange]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const allTeams = Object.values(teamGroups).flat();

    const tableColumns = [
        "Team", "Adser", "ID โฆษณา", "ID เพจ", "Content", "Acc Facebook", "กลุ่มเป้าหมาย", 
        "ไม่รวมกลุ่มเป้าหมาย", "สถานะ", "งบรัน", "Note", "Cover/1$", "ต้นทุนทัก CPM", 
        "ต้นทุนทัก จากเฟส", "ต้นทุนต่อเติม", "ยอดทัก", "ยอดเสีย", "ทักคุณภาพ", 
        "งบที่ใช้", "สมัคร", "เติม", "ยอดเล่นใหม่(฿)", "ยูส", "เฉลี่ยยอดเล่น", 
        "ทักเงียบ", "ทักซ้ำ", "มียูส", "ก่อกวน", "บล็อก", "ต่ำกว่า18", "อายุเกิน50", "ต่างชาติ"
    ];

    const getCellValue = (row: AdMetricsRow, column: string) => {
        switch (column) {
            case "Team": return row.team_name;
            case "Adser": return row.adser;
            case "ID โฆษณา": return row.ad_id;
            case "ID เพจ": return row.page_id;
            case "Content": return row.content;
            case "Acc Facebook": return row.facebook_account;
            case "กลุ่มเป้าหมาย": return row.target_audience;
            case "ไม่รวมกลุ่มเป้าหมาย": return row.exclude_audience;
            case "สถานะ": return row.status;
            case "งบรัน": return formatNumber(row.budget);
            case "Note": return row.note;
            case "Cover/1$": return formatNumber(row.one_dollar_per_cover, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            case "ต้นทุนทัก CPM": return formatNumber(row.cpm_cost_per_inquiry, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            case "ต้นทุนทัก จากเฟส": return formatNumber(row.facebook_cost_per_inquiry, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            case "ต้นทุนต่อเติม": return formatNumber(row.cost_per_deposit, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            case "ยอดทัก": return formatNumber(row.total_inquiries);
            case "ยอดเสีย": return formatNumber(row.wasted_inquiries);
            case "ทักคุณภาพ": return formatNumber(row.net_inquiries);
            case "งบที่ใช้": return formatNumber(row.actual_spend);
            case "สมัคร": return formatNumber(row.registrations);
            case "เติม": return formatNumber(row.deposits_count);
            case "ยอดเล่นใหม่(฿)": return formatNumber(row.new_player_value_thb, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            case "ยูส": return formatNumber(row.existing_users);
            case "เฉลี่ยยอดเล่น": return formatNumber(row.avg_player_value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            case "ทักเงียบ": return formatNumber(row.silent_inquiries);
            case "ทักซ้ำ": return formatNumber(row.repeat_inquiries);
            case "มียูส": return formatNumber(row.existing_user_inquiries);
            case "ก่อกวน": return formatNumber(row.spam_inquiries);
            case "บล็อก": return formatNumber(row.blocked_inquiries);
            case "ต่ำกว่า18": return formatNumber(row.under_18_inquiries);
            case "อายุเกิน50": return formatNumber(row.over_50_inquiries);
            case "ต่างชาติ": return formatNumber(row.foreigner_inquiries);
            default: return '-';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Monitor</h1>
                <p className="text-muted-foreground">
                    หน้าสำหรับติดตามประสิทธิภาพโฆษณาแบบเรียลไทม์ (เวอร์ชันทดลอง)
                </p>
            </div>

            <Card>
                {/* --- 🟢 ส่วนที่แก้ไข: ลด Padding ของ Header --- */}
                <CardHeader className="py-4">
                </CardHeader>
                {/* --- สิ้นสุดส่วนที่แก้ไข --- */}
                <CardContent>
                    {/* --- 🟢 ส่วนที่แก้ไข: เปลี่ยนเป็น Flex Layout และจัดชิดขวา --- */}
                    <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-4">
                        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="เลือกทีม" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทุกทีม</SelectItem>
                                {allTeams.map((team) => (
                                    <SelectItem key={team} value={team}>{team}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedAdser} onValueChange={setSelectedAdser}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="เลือก Adser" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทุกคน</SelectItem>
                                {availableAdsers.map((adser) => (
                                    <SelectItem key={adser} value={adser}>{adser}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <DateRangePickerWithPresets 
                            className="w-full sm:w-auto"
                            initialDateRange={dateRange} 
                            onDateRangeChange={setDateRange} 
                        />
                    </div>
                    {/* --- สิ้นสุดส่วนที่แก้ไข --- */}
                </CardContent>
            </Card>

            <Card>
                 {/* --- 🟢 ส่วนที่แก้ไข: ลด Padding ของ Header --- */}
                <CardHeader className="py-4">
                    <CardTitle>ตารางข้อมูลโฆษณา</CardTitle>
                </CardHeader>
                {/* --- สิ้นสุดส่วนที่แก้ไข --- */}
                {loading ? (
                    <div className="p-6">
                        <Skeleton className="h-10 w-full mb-4" />
                        <div className="space-y-2">
                             <Skeleton className="h-10 w-full" />
                             <Skeleton className="h-10 w-full" />
                             <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                ) : error ? (
                    <div className="p-6 text-red-500 text-center">
                        Error: {error}
                    </div>
                ) : data.length === 0 ? (
                    <div className="p-6 text-muted-foreground text-center">
                        ไม่พบข้อมูลสำหรับเงื่อนไขที่เลือก
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table className="whitespace-nowrap">
                            <TableHeader>
                                <TableRow>
                                    {tableColumns.map((header) => (
                                        <TableHead key={header} className="px-6 w-[150px]">
                                            {header}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((row, index) => (
                                    <TableRow key={index}>
                                        {tableColumns.map((column) => (
                                            <TableCell key={column} className="px-6">
                                                {getCellValue(row, column)}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </Card>
        </div>
    );
}