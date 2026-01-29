import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { randomBytes } from "crypto";

type PasteCreateBody = {
  content: string;
  expiresInSeconds?: number;
  maxViews?: number;
};

function generateId(size = 8) {
  return randomBytes(size).toString("base64url").slice(0, size);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PasteCreateBody;

    if (!body.content || !body.content.trim()) {
      return NextResponse.json(
        { detail: "Content is required" },
        { status: 400 }
      );
    }

    const id = generateId(8);
    const now = new Date();
    let expiresAt: Date | null = null;

    if (body.expiresInSeconds && body.expiresInSeconds > 0) {
      expiresAt = new Date(now.getTime() + body.expiresInSeconds * 1000);
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        "DELETE FROM pastes WHERE expires_at IS NOT NULL AND expires_at < NOW()"
      );

      await client.query(
        "DELETE FROM pastes WHERE max_views IS NOT NULL AND view_count >= max_views"
      );

      await client.query(
        `INSERT INTO pastes (id, content, created_at, expires_at, max_views, view_count)
         VALUES ($1, $2, NOW(), $3, $4, 0)`,
        [id, body.content, expiresAt, body.maxViews ?? null]
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
        url: `/paste/${id}`
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

