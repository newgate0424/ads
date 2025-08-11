import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connection } from './db';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials.password) return null;

                const [rows]: any[] = await connection.execute(
                    'SELECT * FROM users WHERE username = ?',
                    [credentials.username]
                );
                const user = rows[0];

                if (user && await bcrypt.compare(credentials.password, user.password)) {
                    // สร้าง Session Token ใหม่ทุกครั้งที่ล็อกอินสำเร็จ
                    const newSessionToken = randomBytes(32).toString('hex');
                    await connection.execute(
                        'UPDATE users SET session_token = ? WHERE id = ?',
                        [newSessionToken, user.id]
                    );

                    // ส่ง token ไปพร้อมกับข้อมูล user
                    return { 
                        id: user.id.toString(), 
                        name: user.username, 
                        sessionToken: newSessionToken 
                    };
                }
                return null;
            }
        })
    ],
    pages: {
        signIn: '/',
    },
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        // Callback นี้จะถูกเรียกตอนสร้าง JWT (Session)
        async jwt({ token, user }) {
            // ถ้าเป็นตอนล็อกอินครั้งแรก (มี object 'user' อยู่)
            if (user) {
                token.id = user.id;
                token.sessionToken = (user as any).sessionToken;
            }
            return token;
        },
        // Callback นี้จะถูกเรียกตอนใช้ useSession หรือ getSession
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                
                // --- ส่วนสำคัญ: ตรวจสอบ Session Token ล่าสุด ---
                const [rows]: any[] = await connection.execute(
                    'SELECT session_token FROM users WHERE id = ?',
                    [token.id]
                );
                const latestToken = rows[0]?.session_token;

                // ถ้า token ใน session ปัจจุบันไม่ตรงกับใน DB (แสดงว่ามีคนล็อกอินซ้อน)
                if (latestToken !== token.sessionToken) {
                    // คืนค่า session เป็น null เพื่อบังคับให้ออกจากระบบ
                    return null as any; 
                }
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
};