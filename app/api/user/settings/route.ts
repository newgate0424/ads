import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connection } from '@/lib/db';

// ฟังก์ชันสำหรับดึงข้อมูล Settings ของผู้ใช้
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.name) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        // เพิ่ม last_filter_range เข้ามาใน SELECT
        const [rows]: any[] = await connection.execute(
            'SELECT sidebar_collapsed, theme, color_theme, last_filter_range FROM users WHERE username = ?',
            [session.user.name]
        );

        if (rows.length === 0) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(rows[0]);
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// ฟังก์ชันสำหรับอัปเดตข้อมูล Settings
export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.name) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const settings = await req.json();
        const fields = Object.keys(settings);
        const values = Object.values(settings);
        const setClauses = fields.map(field => `${field} = ?`).join(', ');

        if (fields.length === 0) {
            return NextResponse.json({ message: 'No settings provided' }, { status: 400 });
        }

        const query = `UPDATE users SET ${setClauses} WHERE username = ?`;
        values.push(session.user.name);

        await connection.execute(query, values);

        return NextResponse.json({ message: 'Settings updated successfully' });
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}