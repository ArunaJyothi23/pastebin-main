import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { randomBytes } from "crypto";

type PasteCreateBody = {
  content: string;
  ttl_seconds?: number | null;
  max_views?: number | null;
  // Backwards-compat camelCase (not used by tests but tolerated)
  expiresInSeconds?: number;
  maxViews?: number;
};

function generateId(size = 8) {
  return randomBytes(size).toString("base64url").slice(0, size);
}

function getNow(req: NextRequest) {
  if (process.env.TEST_MODE === "1") {
    const header = req.headers.get("x-test-now-ms");
    if (header) {
      const ms = Number(header);
      if (!Number.isNaN(ms)) {
        return new Date(ms);
      }
    }
  }
  return new Date();
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PasteCreateBody;

    const content = body.content;
    if (!content || !content.trim()) {
      return NextResponse.json(
        { detail: "Content is required" },
        { status: 400 }
      );
    }

    const id = generateId(8);
    const now = getNow(req);

    // Support both snake_case (spec) and camelCase (internal)
    const ttlSeconds =
      body.ttl_seconds ??
      body.expiresInSeconds ??
      null;
    const maxViews =
      body.max_views ??
      body.maxViews ??
      null;

    let expiresAt: Date | null = null;
    if (ttlSeconds && ttlSeconds > 0) {
      expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Time-based cleanup using deterministic "now"
      await client.query(
        "DELETE FROM pastes WHERE expires_at IS NOT NULL AND expires_at < $1",
        [now]
      );

      // View-based cleanup
      await client.query(
        "DELETE FROM pastes WHERE max_views IS NOT NULL AND view_count >= max_views"
      );

      await client.query(
        `INSERT INTO pastes (id, content, created_at, expires_at, max_views, view_count)
         VALUES ($1, $2, $3, $4, $5, 0)`,
        [id, content, now, expiresAt, maxViews]
      );

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    return NextResponse.json(
      {
        id,
        url: `/p/${id}`
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating paste", err);
    return NextResponse.json(
      { detail: "Failed to create paste" },
      { status: 500 }
    );
  }
}

