'use client';

import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import localizedFormat from 'dayjs/plugin/localizedFormat';
dayjs.locale('th');
dayjs.extend(localizedFormat);

function useMediaQuery(query: string) {
    const [matches, setMatches] = React.useState(false);
    React.useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        window.addEventListener('resize', listener);
        return () => window.removeEventListener('resize', listener);
    }, [matches, query]);
    return matches;
}

interface DateRangePickerWithPresetsProps {
    className?: string;
    onDateRangeChange: (dateRange: DateRange) => void;
    initialDateRange?: DateRange;
}

export function DateRangePickerWithPresets({ className, onDateRangeChange, initialDateRange }: DateRangePickerWithPresetsProps) {
    const [date, setDate] = React.useState<DateRange | undefined>(initialDateRange);
    const [open, setOpen] = React.useState(false);
    const [localSelectedPreset, setLocalSelectedPreset] = React.useState<string | null>(null);
    const isDesktop = useMediaQuery('(min-width: 640px)');
    const currentYear = new Date().getFullYear();

    React.useEffect(() => {
        setDate(initialDateRange);
    }, [initialDateRange]);

    const presets = [
        { label: 'วันนี้', days: 0 },
        { label: 'เมื่อวานนี้', days: 1 },
        { label: '7 วันที่ผ่านมา', days: 7 },
        { label: '14 วันที่ผ่านมา', days: 14 },
        { label: '28 วันที่ผ่านมา', days: 28 },
        { label: '30 วันที่ผ่านมา', days: 30 },
    ];
    
    const complexPresets = [
        { label: 'สัปดาห์นี้', value: 'thisWeek' },
        { label: 'สัปดาห์ที่แล้ว', value: 'lastWeek' },
        { label: 'เดือนนี้', value: 'thisMonth' },
        { label: 'เดือนที่แล้ว', value: 'lastMonth' },
        { label: 'ปีนี้', value: 'thisYear' },
    ];

    const handlePresetClick = (days: number, label: string) => {
        const today = dayjs().toDate();
        let newDateRange: DateRange;
        if (days === 0) {
            newDateRange = { from: today, to: today };
        } else if (days === 1) {
            const yesterday = dayjs().subtract(1, 'day').toDate();
            newDateRange = { from: yesterday, to: yesterday };
        } else {
            const from = dayjs().subtract(days, 'day').toDate();
            newDateRange = { from, to: today };
        }
        setDate(newDateRange);
        setLocalSelectedPreset(label);
    };

    const handleComplexPresetClick = (presetType: string, label: string) => {
        let newDateRange: DateRange;
        const today = dayjs();
        switch (presetType) {
            case 'thisWeek': newDateRange = { from: today.startOf('week').toDate(), to: today.toDate() }; break;
            case 'lastWeek': const lastWeek = today.subtract(1, 'week'); newDateRange = { from: lastWeek.startOf('week').toDate(), to: lastWeek.endOf('week').toDate() }; break;
            case 'thisMonth': newDateRange = { from: today.startOf('month').toDate(), to: today.toDate() }; break;
            case 'lastMonth': const lastMonth = today.subtract(1, 'month'); newDateRange = { from: lastMonth.startOf('month').toDate(), to: lastMonth.endOf('month').toDate() }; break;
            case 'thisYear': newDateRange = { from: today.startOf('year').toDate(), to: today.toDate() }; break;
            default: return;
        }
        setDate(newDateRange);
        setLocalSelectedPreset(label);
    };

    const handleApply = () => {
        if (date?.from && date?.to) {
            onDateRangeChange(date);
            setOpen(false);
        }
    };

    const handleCancel = () => {
        setDate(initialDateRange);
        setOpen(false);
        setLocalSelectedPreset(null);
    };

    const formatDateRange = (dateRange: DateRange | undefined) => {
        if (!dateRange?.from) return 'เลือกช่วงเวลา';
        const formattedFrom = dayjs(dateRange.from).format('D MMMM YYYY');
        if (!dateRange.to || dayjs(dateRange.from).isSame(dayjs(dateRange.to), 'day')) {
            return formattedFrom;
        }
        const formattedTo = dayjs(dateRange.to).format('D MMMM YYYY');
        return `${formattedFrom} - ${formattedTo}`;
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {/* --- 🟢 ส่วนที่แก้ไข --- */}
                <Button id="date" variant={"outline"} className={cn("w-auto justify-start text-left font-normal", !date && "text-muted-foreground", className)}>
                {/* --- สิ้นสุดส่วนที่แก้ไข --- */}
                    <CalendarIcon className="mr-1 h-4 w-4" />
                    {formatDateRange(date)}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2 sm:p-4" align="end">
                <div className="flex flex-col sm:flex-row">
                    <div className="flex flex-col space-y-1 p-1 w-full sm:w-[160px] border-b sm:border-b-0 sm:border-r max-h-[290px] overflow-y-auto">
                        <div className="flex flex-col space-y-1">
                            {presets.map(preset => (
                                <Button
                                    key={preset.label}
                                    variant="ghost"
                                    onClick={() => handlePresetClick(preset.days, preset.label)}
                                    className="justify-start pl-0 text-sm h-8"
                                >
                                    <div className="w-4 h-4 rounded-full border border-border flex items-center justify-center mr-2">
                                        {localSelectedPreset === preset.label && (
                                            <div className="w-2 h-2 rounded-full bg-primary" />
                                        )}
                                    </div>
                                    {preset.label}
                                </Button>
                            ))}
                        </div>
                        <Separator className="my-2" />
                        {complexPresets.map(preset => (
                            <Button 
                                key={preset.label} 
                                variant="ghost" 
                                className="justify-start pl-0 text-sm h-8"
                                onClick={() => handleComplexPresetClick(preset.value, preset.label)}
                            >
                                    <div className="w-4 h-4 rounded-full border border-border flex items-center justify-center mr-2">
                                        {localSelectedPreset === preset.label && (
                                            <div className="w-2 h-2 rounded-full bg-primary" />
                                        )}
                                    </div>
                                {preset.label}
                            </Button>
                        ))}
                    </div>
                    <Calendar
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={isDesktop ? 2 : 1}
                        classNames={{
                            caption_label: "text-base font-medium",
                            day: "h-6 w-7 p-0 text-sm",
                            day_range_end: "rounded-r-full",
                            day_range_start: "rounded-l-full",
                            day_selected: "rounded-full",
                        }}
                    />
                </div>
                <div className="flex justify-between items-center p-3 border-t">
                    <Button variant="outline" onClick={handleCancel}>ยกเลิก</Button>
                    <Button onClick={handleApply}>อัปเดต</Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}