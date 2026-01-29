import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL env var is required for Postgres connection");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000
});

export type PasteRow = {
  id: string;
  content: string;
  created_at: string;
  expires_at: string | null;
  max_views: number | null;
  views: number;
};

