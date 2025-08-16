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
                    const newSessionToken = randomBytes(32).toString('hex');
                    const now = new Date();

                    await connection.execute(
                        'UPDATE users SET session_token = ?, last_seen = ?, is_online = ? WHERE id = ?',
                        [newSessionToken, now, true, user.id]
                    );
                    
                    await connection.execute(
                        'INSERT INTO activity_logs (user_id, action) VALUES (?, ?)',
                        [user.id.toString(), 'login']
                    );

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
        // --- 🟢 เพิ่มโค้ดตรงนี้ ---
        // กำหนดอายุของ Session เป็น 24 ชั่วโมง (24 * 60 * 60 = 86400 วินาที)
        maxAge: 24 * 60 * 60, 
    },
    jwt: {
        // --- 🟢 เพิ่มโค้ดตรงนี้ ---
        // กำหนดอายุของ JWT ให้เท่ากับ Session เพื่อความสอดคล้องกัน
        maxAge: 24 * 60 * 60,
    },
    // --- สิ้นสุดโค้ดที่เพิ่ม ---
    events: {
        async signOut({ token }) {
            if (token.id) {
                await connection.execute(
                    'UPDATE users SET is_online = ? WHERE id = ?',
                    [false, token.id]
                );
            }
        }
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.sessionToken = (user as any).sessionToken;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                
                const [rows]: any[] = await connection.execute(
                    'SELECT session_token FROM users WHERE id = ?',
                    [token.id]
                );
                const latestToken = rows[0]?.session_token;

                if (latestToken !== token.sessionToken) {
                    return null as any; 
                }
                
                await connection.execute(
                    'UPDATE users SET last_seen = ? WHERE id = ?',
                    [new Date(), token.id]
                );
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
};