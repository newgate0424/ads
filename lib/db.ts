import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL!,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  
  // --- 🟢 เพิ่มการตั้งค่านี้เข้าไป ---
  // ส่ง Ping ไปยังฐานข้อมูลทุกๆ 20 วินาทีบน connection ที่ไม่ได้ใช้งาน
  // เพื่อป้องกันปัญหา Idle Timeout
  keepAliveInitialDelay: 20000 
});

export const connection = pool;