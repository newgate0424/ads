'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { teamGroups } from '@/lib/config';
import dayjs from 'dayjs';
import { DateRange } from 'react-day-picker';
import { DateRangePickerWithPresets } from '@/components/date-range-picker-with-presets';

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

export default function MonitorPage() {
    const [selectedTeam, setSelectedTeam] = useState<string>('all');
    const [selectedAdser, setSelectedAdser] = useState<string>('all');
    const [availableAdsers, setAvailableAdsers] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: dayjs().startOf('day').toDate(),
        to: dayjs().endOf('day').toDate(),
    });

    useEffect(() => {
        if (selectedTeam && selectedTeam !== 'all') {
            setAvailableAdsers(adserData[selectedTeam] || []);
        } else {
            const allAdsers = Object.values(adserData).flat();
            setAvailableAdsers([...new Set(allAdsers)]);
        }
        setSelectedAdser('all'); 
    }, [selectedTeam]);


    const allTeams = Object.values(teamGroups).flat();

    const tableColumns = [
        "Team", "Adser", "ID โฆษณา", "ID เพจ", "Content", "Acc Facebook", "กลุ่มเป้าหมาย", 
        "ไม่รวมกลุ่มเป้าหมาย", "สถานะ", "งบรัน", "Note", "Cover/1$", "ต้นทุนทัก CPM", 
        "ต้นทุนทัก จากเฟส", "ต้นทุนต่อเติม", "ยอดทัก", "ยอดเสีย", "ทักคุณภาพ", 
        "งบที่ใช้", "สมัคร", "เติม", "ยอดเล่นใหม่(฿)", "ยูส", "เฉลี่ยยอดเล่น", 
        "ทักเงียบ", "ทักซ้ำ", "มียูส", "ก่อกวน", "บล็อก", "ต่ำกว่า18", "อายุเกิน50", "ต่างชาติ"
    ];

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
                            <TableRow>
                                <TableCell colSpan={tableColumns.length} className="h-48 text-center">
                                    ยังไม่มีข้อมูล (ส่วนนี้จะแสดงข้อมูลจริงในอนาคต)
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}