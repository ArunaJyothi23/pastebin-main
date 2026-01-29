import { NextRequest, NextResponse } from "next/server";
import { pool, type PasteRow } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

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

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    const now = getNow(req);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { rows } = await client.query<PasteRow>(
        "SELECT * FROM pastes WHERE id = $1",
        [id]
      );

      if (rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { detail: "Paste not found" },
          { status: 404 }
        );
      }

      const paste = rows[0];

      if (paste.expires_at && new Date(paste.expires_at) < now) {
        await client.query("DELETE FROM pastes WHERE id = $1", [id]);
        await client.query("COMMIT");
        // Spec: unavailable paste → 404
        return NextResponse.json(
          { detail: "Paste not found" },
          { status: 404 }
        );
      }

      if (
        paste.max_views !== null &&
        paste.view_count >= paste.max_views
      ) {
        await client.query("DELETE FROM pastes WHERE id = $1", [id]);
        await client.query("COMMIT");
        return NextResponse.json(
          { detail: "Paste not found" },
          { status: 404 }
        );
      }

      const { rows: updatedRows } = await client.query<PasteRow>(
        "UPDATE pastes SET view_count = view_count + 1 WHERE id = $1 RETURNING *",
        [id]
      );

      await client.query("COMMIT");

      const updated = updatedRows[0];

      return NextResponse.json({
        content: updated.content,
        viewCount: updated.view_count,
        expiresAt: updated.expires_at,
        maxViews: updated.max_views
      });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error fetching paste", err);
    return NextResponse.json(
      { detail: "Failed to fetch paste" },
      { status: 500 }
    );
  }
}

