import { pool } from './lib/db.js';

async function testConn() {
    console.log("Testing Database Connection...");
    try {
        const res = await pool.query('SELECT NOW()');
        console.log("Success! Current DB Time:", res.rows[0].now);
    } catch (err) {
        console.error("Connection Failed:", err.message);
    } finally {
        await pool.end();
    }
}

testConn();
