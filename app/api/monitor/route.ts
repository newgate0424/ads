// app/api/monitor/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connection } from '@/lib/db';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        // ดึงข้อมูลสรุปจากหลายๆ ตาราง
        const [usersResult]: any[] = await connection.execute('SELECT COUNT(*) as totalUsers FROM users');
        const [salesResult]: any[] = await connection.execute('SELECT COUNT(*) as totalRecords, SUM(total_price) as totalRevenue, MAX(sale_date) as lastSaleDate FROM sales_data');

        const monitorData = {
            totalUsers: usersResult[0].totalUsers,
            totalSalesRecords: salesResult[0].totalRecords,
            totalRevenue: salesResult[0].totalRevenue,
            lastSaleDate: salesResult[0].lastSaleDate,
        };

        return NextResponse.json(monitorData);
    } catch (error: any) {
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}