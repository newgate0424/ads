// app/api/monitor/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connection } from '@/lib/db';
import dayjs from 'dayjs';

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

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const teamName = searchParams.get('team') || 'all';
        const adser = searchParams.get('adser') || 'all';
        const startDate = searchParams.get('startDate') || dayjs().startOf('day').format('YYYY-MM-DD');
        const endDate = searchParams.get('endDate') || dayjs().endOf('day').format('YYYY-MM-DD');

        let whereClauses: string[] = [`record_date BETWEEN ? AND ?`];
        let params: (string | number)[] = [startDate, endDate];

        if (teamName !== 'all') {
            whereClauses.push('team_name = ?');
            params.push(teamName);
        }

        // สมมติว่าในฐานข้อมูลมีคอลัมน์ adser และจะใช้เมื่อมีการเลือก adser ที่ไม่ใช่ 'all'
        // หากไม่มีคอลัมน์นี้ จะต้องทำการแก้ไข Database Schema ก่อน
        if (adser !== 'all') {
            whereClauses.push('adser = ?');
            params.push(adser);
        }

        const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const query = `
            SELECT 
                team_name, adser, ad_id, page_id, content, facebook_account, target_audience, 
                exclude_audience, status, budget, note, one_dollar_per_cover, cpm_cost_per_inquiry, 
                facebook_cost_per_inquiry, cost_per_deposit, total_inquiries, wasted_inquiries, 
                net_inquiries, actual_spend, registrations, deposits_count, new_player_value_thb, 
                existing_users, avg_player_value, silent_inquiries, repeat_inquiries, 
                existing_user_inquiries, spam_inquiries, blocked_inquiries, under_18_inquiries, 
                over_50_inquiries, foreigner_inquiries, record_date
            FROM daily_ad_metrics 
            ${whereClause}
            ORDER BY record_date DESC, team_name ASC
        `;
        // หมายเหตุ: โค้ดนี้สมมติว่ามีตารางชื่อ `daily_ad_metrics` ซึ่งมีข้อมูลโฆษณาแบบละเอียด
        // และมีคอลัมน์ตามที่ต้องการ หากต้องการใช้ตาราง `daily_metrics` เดิม จะต้องปรับ Query ให้เหมาะสม

        const [rows] = await connection.execute(query, params);
        
        return NextResponse.json(rows);
    } catch (error: any) {
        console.error('Error fetching monitor data:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}