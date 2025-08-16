// app/api/dashboard/route.ts
import { NextResponse } from 'next/server';
import { connection } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        // เปลี่ยนจาก DESC เป็น ASC
        const [rows] = await connection.execute('SELECT * FROM daily_metrics ORDER BY record_date ASC');
        return NextResponse.json(rows);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'An error occurred while fetching data.' }, { status: 500 });
    }
}