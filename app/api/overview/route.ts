// app/api/overview/route.ts - แก้ไขสูตร 1$ / Cover ให้ถูกต้อง

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connection } from '@/lib/db';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

// Interfaces
interface DailyMetricsRow {
    team_name: string;
    record_date: Date;
    planned_inquiries: string;
    total_inquiries: string;
    wasted_inquiries: string;
    net_inquiries: string;
    planned_daily_spend: string;
    actual_spend: string;
    deposits_count: string;
    silent_inquiries: string;
    repeat_inquiries: string;
    existing_user_inquiries: string;
    spam_inquiries: string;
    blocked_inquiries: string;
    under_18_inquiries: string;
    over_50_inquiries: string;
    foreigner_inquiries: string;
    new_player_value_thb: string;
}

interface DailyDataPoint {
    date: string;
    value: number;
}

interface TeamMetric {
    team_name: string;
    planned_inquiries: number;
    total_inquiries: number;
    wasted_inquiries: number;
    net_inquiries: number;
    planned_daily_spend: number;
    actual_spend: number;
    cpm_cost_per_inquiry: number;
    facebook_cost_per_inquiry: number;
    deposits_count: number;
    inquiries_per_deposit: number;
    quality_inquiries_per_deposit: number;
    cost_per_deposit: number;
    new_player_value_thb: number;
    one_dollar_per_cover: number;
    page_blocks_7d: number;
    page_blocks_30d: number;
    silent_inquiries: number;
    repeat_inquiries: number;
    existing_user_inquiries: number;
    spam_inquiries: number;
    blocked_inquiries: number;
    under_18_inquiries: number;
    over_50_inquiries: number;
    foreigner_inquiries: number;
    cpm_cost_per_inquiry_daily: DailyDataPoint[];
    deposits_count_daily: DailyDataPoint[];
    cost_per_deposit_daily: DailyDataPoint[];
    one_dollar_per_cover_daily: DailyDataPoint[];
}

// Cache สำหรับ exchange rate
let cachedExchangeRate: { rate: number; timestamp: number } | null = null;
const CACHE_DURATION = 3600000; // 1 ชั่วโมง

async function getExchangeRate(): Promise<number> {
    const now = Date.now();
    
    // ตรวจสอบ cache ก่อน
    if (cachedExchangeRate && (now - cachedExchangeRate.timestamp) < CACHE_DURATION) {
        return cachedExchangeRate.rate;
    }
    
    // ลอง API หลายตัว
    const apis = [
        {
            url: `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGERATE_API_KEY}/latest/USD`,
            extractRate: (data: any) => data.conversion_rates?.THB
        },
        {
            url: 'https://api.exchangerate.host/latest?base=USD&symbols=THB',
            extractRate: (data: any) => data.rates?.THB
        }
    ];
    
    for (const api of apis) {
        try {
            const response = await fetch(api.url, {
                headers: {
                    'User-Agent': 'Dashboard-App/1.0'
                },
                signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok) {
                const data = await response.json();
                const rate = api.extractRate(data);
                
                if (rate && rate > 0) {
                    cachedExchangeRate = { rate, timestamp: now };
                    console.log(`Exchange rate fetched successfully: ${rate}`);
                    return rate;
                }
            }
        } catch (error) {
            console.error(`Failed to fetch from ${api.url}:`, error);
            continue;
        }
    }
    
    // ถ้าทุก API ล้มเหลว ใช้ค่า default
    console.warn('All exchange rate APIs failed, using default rate: 36.5');
    return 36.5;
}

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const usdToThbRate = await getExchangeRate();

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate') || dayjs().startOf('day').format('YYYY-MM-DD');
        const endDate = searchParams.get('endDate') || dayjs().endOf('day').format('YYYY-MM-DD');
        
        // 1. Query ข้อมูลจากฐานข้อมูล
        const query = `
            SELECT *
            FROM daily_metrics
            WHERE record_date BETWEEN ? AND ?
            ORDER BY record_date ASC
        `;
        const [rows] = await connection.execute(query, [startDate, endDate]);
        const dailyMetricsRows = rows as DailyMetricsRow[];

        // 2. ประมวลผลข้อมูล
        const teamDataMap = new Map<string, TeamMetric>();

        dailyMetricsRows.forEach(row => {
            const teamName = row.team_name;
            const date = dayjs(row.record_date).format('YYYY-MM-DD');

            if (!teamDataMap.has(teamName)) {
                teamDataMap.set(teamName, {
                    team_name: teamName,
                    planned_inquiries: 0,
                    total_inquiries: 0,
                    wasted_inquiries: 0,
                    net_inquiries: 0,
                    planned_daily_spend: 0,
                    actual_spend: 0,
                    deposits_count: 0,
                    new_player_value_thb: 0,
                    cpm_cost_per_inquiry: 0,
                    cost_per_deposit: 0,
                    inquiries_per_deposit: 0,
                    quality_inquiries_per_deposit: 0,
                    one_dollar_per_cover: 0,
                    page_blocks_7d: 0,
                    page_blocks_30d: 0,
                    silent_inquiries: 0,
                    repeat_inquiries: 0,
                    existing_user_inquiries: 0,
                    spam_inquiries: 0,
                    blocked_inquiries: 0,
                    under_18_inquiries: 0,
                    over_50_inquiries: 0,
                    foreigner_inquiries: 0,
                    cpm_cost_per_inquiry_daily: [],
                    deposits_count_daily: [],
                    cost_per_deposit_daily: [],
                    one_dollar_per_cover_daily: [],
                    facebook_cost_per_inquiry: 0,
                });
            }

            const team = teamDataMap.get(teamName)!;
            const spend = Number(row.actual_spend);
            const inquiries = Number(row.total_inquiries);
            const deposits = Number(row.deposits_count);
            const netInquiries = Number(row.net_inquiries);
            const newPlayerValue = Number(row.new_player_value_thb);

            // คำนวณข้อมูลสรุป (สำหรับตาราง)
            team.planned_inquiries += Number(row.planned_inquiries);
            team.total_inquiries += inquiries;
            team.wasted_inquiries += Number(row.wasted_inquiries);
            team.net_inquiries += netInquiries;
            team.planned_daily_spend += Number(row.planned_daily_spend);
            team.actual_spend += spend;
            team.deposits_count += deposits;
            team.new_player_value_thb += newPlayerValue;
            team.silent_inquiries += Number(row.silent_inquiries);
            team.repeat_inquiries += Number(row.repeat_inquiries);
            team.existing_user_inquiries += Number(row.existing_user_inquiries);
            team.spam_inquiries += Number(row.spam_inquiries);
            team.blocked_inquiries += Number(row.blocked_inquiries);
            team.under_18_inquiries += Number(row.under_18_inquiries);
            team.over_50_inquiries += Number(row.over_50_inquiries);
            team.foreigner_inquiries += Number(row.foreigner_inquiries);

            // คำนวณข้อมูลรายวัน (สำหรับกราฟ)
            const cmpCostDaily = inquiries > 0 ? spend / inquiries : 0;
            const costPerDepositDaily = deposits > 0 ? spend / deposits : 0;

            team.cpm_cost_per_inquiry_daily.push({ date, value: cmpCostDaily });
            team.deposits_count_daily.push({ date, value: deposits });
            team.cost_per_deposit_daily.push({ date, value: costPerDepositDaily });
        });

        // 3. คำนวณ 1$ / Cover สำหรับกราฟ (ยอดสะสม)
        Array.from(teamDataMap.values()).forEach(team => {
            let cumulativeSpend = 0;
            let cumulativeNewPlayerValue = 0;

            // หาข้อมูลต้นฉบับที่เรียงตามวันที่
            const originalData = dailyMetricsRows
                .filter(row => row.team_name === team.team_name)
                .sort((a, b) => new Date(a.record_date).getTime() - new Date(b.record_date).getTime());

            // คำนวณยอดสะสมและ 1$ / Cover รายวัน
            originalData.forEach(row => {
                const date = dayjs(row.record_date).format('YYYY-MM-DD');
                const spend = Number(row.actual_spend);
                const newPlayerValue = Number(row.new_player_value_thb);

                cumulativeSpend += spend;
                cumulativeNewPlayerValue += newPlayerValue;

                // ✅ สูตรที่ถูกต้อง: ยอดเล่นสะสม ÷ ใช้จ่ายสะสม ÷ อัตราแลกเปลี่ยน
                const oneDollarPerCoverDaily = (cumulativeSpend > 0 && usdToThbRate > 0) 
                    ? cumulativeNewPlayerValue / cumulativeSpend / usdToThbRate
                    : 0;

                team.one_dollar_per_cover_daily.push({ date, value: oneDollarPerCoverDaily });
            });
        });

        // 4. คำนวณค่าเฉลี่ยและค่าอื่นๆ สำหรับข้อมูลสรุป (ตาราง)
        const teamMetrics: TeamMetric[] = Array.from(teamDataMap.values()).map(team => {
            const totalSpend = team.actual_spend;
            const totalInquiries = team.total_inquiries;
            const totalDeposits = team.deposits_count;
            const totalNewPlayerValue = team.new_player_value_thb;

            team.cpm_cost_per_inquiry = totalInquiries > 0 ? totalSpend / totalInquiries : 0;
            team.cost_per_deposit = totalDeposits > 0 ? totalSpend / totalDeposits : 0;
            team.inquiries_per_deposit = totalDeposits > 0 ? totalInquiries / totalDeposits : 0;
            team.quality_inquiries_per_deposit = totalDeposits > 0 ? team.net_inquiries / totalDeposits : 0;
            
            // ✅ สูตรที่ถูกต้องสำหรับตาราง: ยอดเล่นรวม ÷ ใช้จ่ายรวม ÷ อัตราแลกเปลี่ยน
            team.one_dollar_per_cover = (totalSpend > 0 && usdToThbRate > 0)
                ? totalNewPlayerValue / totalSpend / usdToThbRate
                : 0;

            return team;
        });

        return NextResponse.json(teamMetrics);

    } catch (error: any) {
        console.error('Error in API route:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}