import pg from "pg";
const { Pool } = pg;
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.DATABASE_URL;
let useSQLite = false;

if (!connectionString) {
    useSQLite = true;
}

export const pool = !useSQLite ? new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 3000,
}) : null;

let sqliteDb = null;

export async function getClient() {
    if (useSQLite) {
        if (!sqliteDb) {
            sqliteDb = await open({
                filename: path.resolve(process.cwd(), "database.sqlite"),
                driver: sqlite3.Database
            });
            await sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS pastes (
          id TEXT PRIMARY KEY,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME NULL,
          max_views INTEGER NULL,
          views INTEGER DEFAULT 0
        )
      `);
        }
        return {
            query: async (text, params) => {
                const sql = text.replace(/\$\d+/g, "?").replace("RETURNING *", "");
                if (text.trim().startsWith("SELECT")) {
                    const rows = await sqliteDb.all(sql, params);
                    return { rows };
                } else {
                    const result = await sqliteDb.run(sql, params);
                    if (text.includes("RETURNING")) {
                        // For INSERT, get the last row. For UPDATE, use the ID from params.
                        const lookupId = text.includes("INSERT") ? result.lastID : params[params.length - 1];
                        const rawRows = await sqliteDb.all("SELECT * FROM pastes WHERE id = ?", [lookupId]);
                        return { rows: rawRows };
                    }
                    return { rows: [] };
                }
            },
            release: () => { },
            // Shim for transactions
            beginTransaction: () => sqliteDb.run("BEGIN"),
            commit: () => sqliteDb.run("COMMIT"),
            rollback: () => sqliteDb.run("ROLLBACK")
        };
    } else {
        const client = await pool.connect();
        // Add transaction helpers to match sqlite shim
        client.beginTransaction = () => client.query("BEGIN");
        client.commit = () => client.query("COMMIT");
        client.rollback = () => client.query("ROLLBACK");
        return client;
    }
}

export async function initDb() {
    try {
        const client = await getClient();
        if (!useSQLite) {
            await client.query(`
        CREATE TABLE IF NOT EXISTS pastes (
          id TEXT PRIMARY KEY,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP WITH TIME ZONE,
          max_views INTEGER,
          views INTEGER DEFAULT 0
        );
      `);
            client.release();
        }
        console.log("✔ Database ready (" + (useSQLite ? "SQLite" : "Postgres") + ")");
    } catch (err) {
        if (!useSQLite) {
            console.log("ℹ Postgres not available, switching to Local SQLite...");
            useSQLite = true;
            await initDb();
        } else {
            console.error("✘ Database initialization failed:", err.message);
        }
    }
}
