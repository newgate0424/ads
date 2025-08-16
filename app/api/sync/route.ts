// app/api/sync/route.ts
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { connection } from '@/lib/db';

// เพิ่ม header นี้เพื่อให้ Vercel รันได้นานขึ้น (สูงสุด 60 วินาที)
export const maxDuration = 60;

// เราจะใช้ GET method และป้องกันด้วย secret key ง่ายๆ
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    // เพิ่ม secret key เพื่อป้องกันไม่ให้คนอื่นมายิง API นี้เล่น
    const apiKey = searchParams.get('api_key');
    if (apiKey !== process.env.SYNC_API_KEY) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting data sync from Google Sheets...');
    try {
        const sheets = google.sheets({
            version: 'v4',
            auth: process.env.GOOGLE_API_KEY, // ใช้ GOOGLE_API_KEY แทน GOOGLE_SHEETS_API_KEY
        });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'Data!A2:AC', // สมมติว่ามีข้อมูลถึงคอลัมน์ AC
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return NextResponse.json({ message: 'No new data found.' });
        }

        console.log(`Found ${rows.length} rows to sync.`);
        const db = await connection;

        // ใช้ INSERT ... ON DUPLICATE KEY UPDATE เพื่อประสิทธิภาพ
        // ถ้า record_date และ team_name ซ้ำ จะอัปเดตข้อมูลแทนการเพิ่มใหม่
        const query = `
            INSERT INTO daily_metrics (record_date, team_name, kpi_budget_used_pct, planned_inquiries, total_inquiries, meta_inquiries, wasted_inquiries, net_inquiries, planned_daily_spend, actual_spend, cpm_cost_per_inquiry, facebook_cost_per_inquiry, deposits_count, inquiries_per_deposit, quality_inquiries_per_deposit, cost_per_deposit, new_player_value_thb, one_dollar_per_cover, page_blocks_7d, page_blocks_30d, silent_inquiries, repeat_inquiries, existing_user_inquiries, spam_inquiries, blocked_inquiries, under_18_inquiries, over_50_inquiries, foreigner_inquiries)
            VALUES ?
            ON DUPLICATE KEY UPDATE
                kpi_budget_used_pct = VALUES(kpi_budget_used_pct),
                planned_inquiries = VALUES(planned_inquiries),
                total_inquiries = VALUES(total_inquiries),
                meta_inquiries = VALUES(meta_inquiries),
                wasted_inquiries = VALUES(wasted_inquiries),
                net_inquiries = VALUES(net_inquiries),
                planned_daily_spend = VALUES(planned_daily_spend),
                actual_spend = VALUES(actual_spend),
                cpm_cost_per_inquiry = VALUES(cpm_cost_per_inquiry),
                facebook_cost_per_inquiry = VALUES(facebook_cost_per_inquiry),
                deposits_count = VALUES(deposits_count),
                inquiries_per_deposit = VALUES(inquiries_per_deposit),
                quality_inquiries_per_deposit = VALUES(quality_inquiries_per_deposit),
                cost_per_deposit = VALUES(cost_per_deposit),
                new_player_value_thb = VALUES(new_player_value_thb),
                one_dollar_per_cover = VALUES(one_dollar_per_cover),
                page_blocks_7d = VALUES(page_blocks_7d),
                page_blocks_30d = VALUES(page_blocks_30d),
                silent_inquiries = VALUES(silent_inquiries),
                repeat_inquiries = VALUES(repeat_inquiries),
                existing_user_inquiries = VALUES(existing_user_inquiries),
                spam_inquiries = VALUES(spam_inquiries),
                blocked_inquiries = VALUES(blocked_inquiries),
                under_18_inquiries = VALUES(under_18_inquiries),
                over_50_inquiries = VALUES(over_50_inquiries),
                foreigner_inquiries = VALUES(foreigner_inquiries)
        `;

        // แปลงข้อมูลจาก Sheet ให้ตรงกับ DB (ใส่ null ถ้าค่าว่าง)
        const values = rows.map(row => [
            row[0] || null, row[1] || null, row[2] || null, row[3] || null, row[4] || null,
            row[5] || null, row[6] || null, row[7] || null, row[8] || null, row[9] || null,
            row[10] || null, row[11] || null, row[12] || null, row[13] || null, row[14] || null,
            row[15] || null, row[16] || null, row[17] || null, row[18] || null, row[19] || null,
            row[20] || null, row[21] || null, row[22] || null, row[23] || null, row[24] || null,
            row[25] || null, row[26] || null, row[27] || null
        ]);

        await db.query(query, [values]);

        return NextResponse.json({ message: 'Sync successful.', syncedRows: rows.length });
    } catch (error: any) {
        console.error('Sync failed:', error);
        return NextResponse.json({ message: 'Sync failed.', error: error.message }, { status: 500 });
    }
}