// lib/config.ts
import dayjs from 'dayjs';

export const fontSizes = [
    { name: 'เล็ก', size: '14px' },
    { name: 'ปกติ', size: '16px' },
    { name: 'ใหญ่', size: '18px' },
];

export const backgroundStyles = [
    { name: 'Default', class: 'bg-gradient-default', previewClass: 'preview-gradient-default' },
    { name: 'Ocean', class: 'bg-gradient-ocean', previewClass: 'preview-gradient-ocean' },
    { name: 'Sunset', class: 'bg-gradient-sunset', previewClass: 'preview-gradient-sunset' },
    { name: 'Forest', class: 'bg-gradient-forest', previewClass: 'preview-gradient-forest' },
];

export const teamGroups = {
    'Lotto': ['สาวอ้อย', 'อลิน', 'อัญญา C', 'อัญญา D'],
    'Bacarat': ['Spezbar', 'Barlance'],
    'Football': ['Football Area', 'Football Area(Haru)']
};

export const cpmThresholds: { [key: string]: number } = {
    'สาวอ้อย': 2.0,
    'อลิน': 2.0,
    'อัญญา C': 2.0,
    'อัญญา D': 1.8,
    'Spezbar': 4.0,
    'Barlance': 4.0,
    'Football Area': 5.0,
    'Football Area(Haru)': 5.0,
};

export const cpmYAxisMax: { [key: string]: number } = {
    'สาวอ้อย': 2.5,
    'อลิน': 2.5,
    'อัญญา C': 2.5,
    'อัญญา D': 2.5,
    'Spezbar': 6,
    'Barlance': 6,
    'Football Area': 6,
    'Football Area(Haru)': 6,
};

export const costPerDepositThresholds: { [key: string]: number } = {
    'สาวอ้อย': 25,
    'อลิน': 25,
    'อัญญา C': 25,
    'อัญญา D': 25,
    'Spezbar': 55,
    'Barlance': 55,
    'Football Area': 65,
    'Football Area(Haru)': 65,
};

export const costPerDepositYAxisMax: { [key: string]: number } = {
    'สาวอ้อย': 30,
    'อลิน': 30,
    'อัญญา C': 30,
    'อัญญา D': 30,
    'Spezbar': 65,
    'Barlance': 65,
    'Football Area': 80,
    'Football Area(Haru)': 80,
};

export const depositsMonthlyTargets: { [key: string]: number } = {
    'สาวอ้อย': 1400,
    'อลิน': 1400,
    'อัญญา C': 1400,
    'อัญญา D': 1400,
    'Spezbar': 1200,
    'Barlance': 600,
    'Football Area': 900,
    'Football Area(Haru)': 450,
};

export const calculateDailyTarget = (monthlyTarget: number, dateString: string): number => {
    const totalDaysInMonth = dayjs(dateString).daysInMonth();
    return Math.round(monthlyTarget / totalDaysInMonth);
};


export const filterButtons = [
    { label: 'วันนี้', value: 'today' },
    { label: 'เมื่อวาน', value: 'yesterday' },
    { label: 'เดือนนี้', value: 'this_month' },
    { label: 'เดือนที่แล้ว', value: 'last_month' },
];