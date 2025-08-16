// app/page.tsx
'use client'; // --- 🟢 เพิ่มบรรทัดนี้ ---

import LoginForm from '@/components/login-form';
import { SessionProvider } from 'next-auth/react'; // --- 🟢 เพิ่มการ import ---

export default function HomePage() {
  return (
    // --- 🟢 เพิ่มการห่อหุ้มด้วย SessionProvider ---
    <SessionProvider>
      <LoginForm />
    </SessionProvider>
  );
}