// File: app/api/user/change-password/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';      // <-- ถูกต้อง
import { connection } from '@/lib/db';         // <-- ใช้ตัวนี้แทน prisma
import { compare, hash } from 'bcryptjs';      // <-- สำหรับจัดการรหัสผ่าน

export async function POST(req: Request) {
    // 1. ตรวจสอบ Session ผู้ใช้
    const session = await getServerSession(authOptions);
    if (!session?.user?.name) { // ตรวจสอบจาก session.user.name ตามโค้ดเดิมของคุณ
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { currentPassword, newPassword } = await req.json();

        // 2. ดึงรหัสผ่านปัจจุบัน (ที่ถูก hash ไว้) จากฐานข้อมูล
        const [rows]: any[] = await connection.execute(
            'SELECT password FROM users WHERE username = ?',
            [session.user.name]
        );

        if (rows.length === 0) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }
        const hashedPasswordFromDb = rows[0].password;
        
        if (!hashedPasswordFromDb) {
            return NextResponse.json({ error: 'ไม่สามารถเปลี่ยนรหัสผ่านสำหรับบัญชีนี้ได้' }, { status: 400 });
        }

        // 3. เปรียบเทียบรหัสผ่านที่ผู้ใช้กรอกกับรหัสในฐานข้อมูล
        const isPasswordCorrect = await compare(currentPassword, hashedPasswordFromDb);
        if (!isPasswordCorrect) {
            return NextResponse.json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }, { status: 400 });
        }

        // 4. เข้ารหัสรหัสผ่านใหม่ (Hash)
        const newHashedPassword = await hash(newPassword, 12);

        // 5. อัปเดตรหัสผ่านใหม่ลงในฐานข้อมูล
        await connection.execute(
            'UPDATE users SET password = ? WHERE username = ?',
            [newHashedPassword, session.user.name]
        );

        return NextResponse.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });

    } catch (error) {
        console.error("Change Password Error (POST):", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}