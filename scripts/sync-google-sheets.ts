// scripts/sync-google-sheets.ts
import { google } from 'googleapis';
import mysql from 'mysql2/promise';

async function syncData() {
    console.log('Starting data sync from Google Sheets to MySQL...');

    // 1. Connect to Google Sheets
    const sheets = google.sheets({
        version: 'v4',
        auth: process.env.GOOGLE_SHEETS_API_KEY,
    });

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Sheet1!A2:D', // สมมติว่าข้อมูลเริ่มที่แถว 2 คอลัมน์ A ถึง D
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
        console.log('No data found in Google Sheet.');
        return;
    }

    console.log(`Found ${rows.length} rows to sync.`);

    // 2. Connect to MySQL
    const db = await mysql.createConnection(process.env.DATABASE_URL!);
    
    // 3. Clear existing data and insert new data
    await db.execute('TRUNCATE TABLE sales_data');
    console.log('Truncated sales_data table.');

    const query = 'INSERT INTO sales_data (product_name, quantity, total_price, sale_date) VALUES ?';
    const values = rows.map(row => [row[0], parseInt(row[1]), parseFloat(row[2]), new Date(row[3])]);
    
    await db.query(query, [values]);
    console.log('Successfully inserted new data.');

    await db.end();
    console.log('Sync finished.');
}

syncData().catch(console.error);