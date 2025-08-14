// File: app/api/user/change-password/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';      // <-- ถูกต้อง
import { connection } from '@/lib/db';         // <-- ใช้ตัวนี้แทน prisma
import { compare, hash } from 'bcryptjs';      // <-- สำหรับจัดการรหัสผ่าน

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.name) { 
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { currentPassword, newPassword } = await req.json();

        // ดึงข้อมูล user ทั้งหมด รวมถึง id
        const [rows]: any[] = await connection.execute(
            'SELECT id, password FROM users WHERE username = ?', // แก้ไข query
            [session.user.name]
        );

        if (rows.length === 0) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }
        const user = rows[0];
        const hashedPasswordFromDb = user.password;
        
        if (!hashedPasswordFromDb) {
            return NextResponse.json({ error: 'ไม่สามารถเปลี่ยนรหัสผ่านสำหรับบัญชีนี้ได้' }, { status: 400 });
        }

        const isPasswordCorrect = await compare(currentPassword, hashedPasswordFromDb);
        if (!isPasswordCorrect) {
            return NextResponse.json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }, { status: 400 });
        }

        const newHashedPassword = await hash(newPassword, 12);

        await connection.execute(
            'UPDATE users SET password = ? WHERE username = ?',
            [newHashedPassword, session.user.name]
        );
        
        // --- เพิ่มโค้ดตรงนี้ ---
        await connection.execute(
            'INSERT INTO activity_logs (user_id, action) VALUES (?, ?)',
            [user.id.toString(), 'change_password']
        );
        // --- สิ้นสุดโค้ดที่เพิ่ม ---

        return NextResponse.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });

    } catch (error) {
        console.error("Change Password Error (POST):", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}