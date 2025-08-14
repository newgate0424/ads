import mysql from 'mysql2/promise';

// เพิ่มการตั้งค่า `waitForConnections` และ `connectionLimit` เข้าไปใน Pool
// เพื่อให้จัดการการเชื่อมต่อได้ดีขึ้นและรอ connection ว่างเมื่อถึงขีดจำกัด
const pool = mysql.createPool({
  uri: process.env.DATABASE_URL!,
  waitForConnections: true,
  connectionLimit: 10, // สามารถปรับค่าได้ตามความเหมาะสม
  queueLimit: 0
});

// เราจะ export pool เหมือนเดิม แต่ด้วยการตั้งค่าที่ดีขึ้น
export const connection = pool;