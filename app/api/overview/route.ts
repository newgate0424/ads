// app/api/overview/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connection } from '@/lib/db';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

// Interfaces
interface SummaryDataRow {
    team_name: string;
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

interface DailyMetricsRow {
    team_name: string;
    record_date: Date;
    actual_spend: string;
    total_inquiries: string;
    deposits_count: string;
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
}


export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        // ดึงอัตราแลกเปลี่ยน USD to THB
        let usdToThbRate = 36.5; // ค่า Default กรณีดึง API ไม่สำเร็จ
        try {
            // อย่าลืมใส่ EXCHANGERATE_API_KEY ในไฟล์ .env.local
            const exchangeRateResponse = await fetch(`https://v6.exchangerate-api.com/v6/${process.env.EXCHANGERATE_API_KEY}/latest/USD`);
            if (exchangeRateResponse.ok) {
                const data = await exchangeRateResponse.json();
                if (data.result === 'success' && data.conversion_rates.THB) {
                    usdToThbRate = data.conversion_rates.THB;
                }
            }
        } catch (e) {
            console.error("Could not fetch exchange rate, using default.", e);
        }

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate') || dayjs().startOf('day').format('YYYY-MM-DD');
        const endDate = searchParams.get('endDate') || dayjs().endOf('day').format('YYYY-MM-DD');

        const whereClause = `WHERE record_date BETWEEN '${startDate}' AND '${endDate}'`;

        // 1. Query ข้อมูลสรุป
        const summaryQuery = `
            SELECT 
                team_name,
                SUM(planned_inquiries) as planned_inquiries,
                SUM(total_inquiries) as total_inquiries,
                SUM(wasted_inquiries) as wasted_inquiries,
                SUM(net_inquiries) as net_inquiries,
                SUM(planned_daily_spend) as planned_daily_spend,
                SUM(actual_spend) as actual_spend,
                SUM(deposits_count) as deposits_count,
                SUM(silent_inquiries) as silent_inquiries,
                SUM(repeat_inquiries) as repeat_inquiries,
                SUM(existing_user_inquiries) as existing_user_inquiries,
                SUM(spam_inquiries) as spam_inquiries,
                SUM(blocked_inquiries) as blocked_inquiries,
                SUM(under_18_inquiries) as under_18_inquiries,
                SUM(over_50_inquiries) as over_50_inquiries,
                SUM(foreigner_inquiries) as foreigner_inquiries,
                SUM(new_player_value_thb) as new_player_value_thb
            FROM daily_metrics
            ${whereClause}
            GROUP BY team_name
            ORDER BY team_name ASC
        `;
        const [summaryRows] = await connection.execute(summaryQuery);

        // 2. Query ข้อมูลรายวัน
        const dailyMetricsQuery = `
            SELECT 
                team_name,
                record_date,
                SUM(actual_spend) as actual_spend,
                SUM(total_inquiries) as total_inquiries,
                SUM(deposits_count) as deposits_count
            FROM daily_metrics
            ${whereClause}
            GROUP BY team_name, record_date
            ORDER BY record_date ASC
        `;
        const [dailyMetricsRows] = await connection.execute(dailyMetricsQuery);

        // 3. เตรียมข้อมูลรายวันใส่ Map เพื่อให้ดึงข้อมูลได้เร็ว
        const dailyCpmMap = new Map<string, DailyDataPoint[]>();
        const dailyDepositsMap = new Map<string, DailyDataPoint[]>();
        const dailyCostPerDepositMap = new Map<string, DailyDataPoint[]>();

        (dailyMetricsRows as DailyMetricsRow[]).forEach(row => {
            const date = dayjs(row.record_date).format('YYYY-MM-DD');
            const spend = Number(row.actual_spend);
            const inquiries = Number(row.total_inquiries);
            const deposits = Number(row.deposits_count);

            if (!dailyCpmMap.has(row.team_name)) dailyCpmMap.set(row.team_name, []);
            if (!dailyDepositsMap.has(row.team_name)) dailyDepositsMap.set(row.team_name, []);
            if (!dailyCostPerDepositMap.has(row.team_name)) dailyCostPerDepositMap.set(row.team_name, []);

            if (inquiries > 0) {
                dailyCpmMap.get(row.team_name)!.push({ date, value: spend / inquiries });
            }
            if (deposits > 0) {
                dailyDepositsMap.get(row.team_name)!.push({ date, value: deposits });
                dailyCostPerDepositMap.get(row.team_name)!.push({ date, value: spend / deposits });
            } else {
                dailyDepositsMap.get(row.team_name)!.push({ date, value: 0 });
                dailyCostPerDepositMap.get(row.team_name)!.push({ date, value: 0 });
            }
        });

        // 4. รวมข้อมูลทั้งหมด
        const teamMetrics: TeamMetric[] = (summaryRows as SummaryDataRow[]).map(team => {
            const totalSpend = Number(team.actual_spend);
            const totalInquiries = Number(team.total_inquiries);
            const totalDeposits = Number(team.deposits_count);
            const totalNewPlayerValue = Number(team.new_player_value_thb);

            const cpmCost = totalInquiries > 0 ? totalSpend / totalInquiries : 0;
            const costPerDeposit = totalDeposits > 0 ? totalSpend / totalDeposits : 0;

            const oneDollarPerCover = (totalSpend > 0 && usdToThbRate > 0) 
                ? (totalNewPlayerValue / totalSpend) / usdToThbRate 
                : 0;

            return {
                team_name: team.team_name,
                planned_inquiries: Number(team.planned_inquiries),
                total_inquiries: totalInquiries,
                wasted_inquiries: Number(team.wasted_inquiries),
                net_inquiries: Number(team.net_inquiries),
                planned_daily_spend: Number(team.planned_daily_spend),
                actual_spend: totalSpend,
                deposits_count: totalDeposits,
                silent_inquiries: Number(team.silent_inquiries),
                repeat_inquiries: Number(team.repeat_inquiries),
                existing_user_inquiries: Number(team.existing_user_inquiries),
                spam_inquiries: Number(team.spam_inquiries),
                blocked_inquiries: Number(team.blocked_inquiries),
                under_18_inquiries: Number(team.under_18_inquiries),
                over_50_inquiries: Number(team.over_50_inquiries),
                foreigner_inquiries: Number(team.foreigner_inquiries),
                new_player_value_thb: totalNewPlayerValue,
                cpm_cost_per_inquiry: cpmCost,
                cost_per_deposit: costPerDeposit,
                inquiries_per_deposit: totalDeposits > 0 ? totalInquiries / totalDeposits : 0,
                quality_inquiries_per_deposit: totalDeposits > 0 ? Number(team.net_inquiries) / totalDeposits : 0,
                one_dollar_per_cover: oneDollarPerCover,
                cpm_cost_per_inquiry_daily: dailyCpmMap.get(team.team_name) || [],
                deposits_count_daily: dailyDepositsMap.get(team.team_name) || [],
                cost_per_deposit_daily: dailyCostPerDepositMap.get(team.team_name) || [],
                facebook_cost_per_inquiry: 0, 
                page_blocks_7d: 0,
                page_blocks_30d: 0,
            };
        });

        return NextResponse.json(teamMetrics);

    } catch (error: any) {
        console.error('Error in API route:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}