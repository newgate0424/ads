// app/api/admin/users/route.ts
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
        // --- 🟢 ส่วนที่แก้ไข ---
        // 1. ดึงผู้ใช้ทั้งหมด พร้อมกับ last_seen เพื่อนำไปคำนวณสถานะ
        const [allUsers]: any[] = await connection.execute(
            'SELECT username, last_seen FROM users ORDER BY last_seen DESC'
        );
        // --- สิ้นสุดส่วนที่แก้ไข ---

        // 2. Get latest activity logs (ยังคงเหมือนเดิม)
        const [activityLogs]: any[] = await connection.execute(
            `SELECT u.username, a.action, a.created_at 
             FROM activity_logs a 
             JOIN users u ON a.user_id = u.id 
             ORDER BY a.created_at DESC 
             LIMIT 50`
        );

        const data = {
            allUsers, // ส่ง allUsers แทน totalUsers และ onlineUsers
            activityLogs
        };

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error fetching admin user data:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}