import { Router } from "express";
import { getClient } from "../lib/db.js";
import { randomBytes } from "crypto";

const router = Router();

function generateId(size = 8) {
    return randomBytes(size).toString("base64url").slice(0, size);
}

function getNow(req) {
    if (process.env.TEST_MODE === "1") {
        const header = req.headers["x-test-now-ms"];
        if (header) {
            const ms = Number(header);
            if (!Number.isNaN(ms)) {
                return new Date(ms);
            }
        }
    }
    return new Date();
}

// POST /api/pastes
router.post("/pastes", async (req, res) => {
    try {
        const { content, ttl_seconds, max_views } = req.body;

        // Validation
        if (!content || typeof content !== "string" || !content.trim()) {
            return res.status(400).json({ detail: "content is required and must be a non-empty string" });
        }
        if (ttl_seconds !== undefined && (!Number.isInteger(ttl_seconds) || ttl_seconds < 1)) {
            return res.status(400).json({ detail: "ttl_seconds must be an integer >= 1" });
        }
        if (max_views !== undefined && (!Number.isInteger(max_views) || max_views < 1)) {
            return res.status(400).json({ detail: "max_views must be an integer >= 1" });
        }

        const id = generateId(8);
        const now = getNow(req);
        let expiresAt = null;
        if (ttl_seconds) {
            expiresAt = new Date(now.getTime() + ttl_seconds * 1000);
        }

        const client = await getClient();
        try {
            await client.beginTransaction();

            // Atomic cleanup of expired/view-limited pastes
            await client.query("DELETE FROM pastes WHERE expires_at IS NOT NULL AND expires_at < $1", [now]);
            await client.query("DELETE FROM pastes WHERE max_views IS NOT NULL AND views >= max_views");

            await client.query(
                `INSERT INTO pastes (id, content, created_at, expires_at, max_views, views)
         VALUES ($1, $2, $3, $4, $5, 0)`,
                [id, content, now, expiresAt, max_views ?? null]
            );

            await client.commit();
        } catch (e) {
            await client.rollback();
            throw e;
        } finally {
            client.release();
        }

        const protocol = req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
        const host = req.get("host");
        const url = `${protocol}://${host}/p/${id}`;

        return res.status(201).json({ id, url });
    } catch (err) {
        console.error("Error creating paste:", err);
        return res.status(500).json({ detail: "Internal server error" });
    }
});

// GET /api/pastes/:id (API JSON)
router.get("/pastes/:id", async (req, res) => {
    const { id } = req.params;
    const now = getNow(req);

    try {
        const client = await getClient();
        try {
            await client.beginTransaction();

            const { rows } = await client.query("SELECT * FROM pastes WHERE id = $1", [id]);

            if (rows.length === 0) {
                await client.rollback();
                return res.status(404).json({ detail: "Paste not found" });
            }

            const paste = rows[0];

            // Check Expiry
            if (paste.expires_at && new Date(paste.expires_at) < now) {
                await client.query("DELETE FROM pastes WHERE id = $1", [id]);
                await client.commit();
                return res.status(404).json({ detail: "Paste has expired" });
            }

            // Check View Count
            if (paste.max_views !== null && paste.views >= paste.max_views) {
                await client.query("DELETE FROM pastes WHERE id = $1", [id]);
                await client.commit();
                return res.status(404).json({ detail: "Paste has reached maximum views" });
            }

            // Update View Count
            const { rows: updatedRows } = await client.query(
                "UPDATE pastes SET views = views + 1 WHERE id = $1 RETURNING *",
                [id]
            );

            await client.commit();
            const updated = updatedRows[0];

            return res.json({
                content: updated.content,
                remaining_views: updated.max_views !== null ? Math.max(0, updated.max_views - updated.views) : null,
                expires_at: updated.expires_at ? new Date(updated.expires_at).toISOString() : null
            });
        } catch (e) {
            await client.rollback();
            throw e;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Error fetching paste:", err);
        return res.status(500).json({ detail: "Internal server error" });
    }
});

// GET /p/:id (HTML View)
router.get("/p/:id", async (req, res) => {
    const { id } = req.params;
    const now = getNow(req);

    try {
        const client = await getClient();
        try {
            await client.beginTransaction();
            const { rows } = await client.query("SELECT * FROM pastes WHERE id = $1", [id]);

            if (rows.length === 0) {
                await client.rollback();
                return res.status(404).send("<h1>404 Not Found</h1><p>Paste does not exist.</p>");
            }

            const paste = rows[0];

            if (paste.expires_at && new Date(paste.expires_at) < now) {
                await client.query("DELETE FROM pastes WHERE id = $1", [id]);
                await client.commit();
                return res.status(404).send("<h1>404 Not Found</h1><p>Paste has expired.</p>");
            }

            if (paste.max_views !== null && paste.views >= paste.max_views) {
                await client.query("DELETE FROM pastes WHERE id = $1", [id]);
                await client.commit();
                return res.status(404).send("<h1>404 Not Found</h1><p>View limit reached.</p>");
            }

            await client.query("UPDATE pastes SET views = views + 1 WHERE id = $1", [id]);
            await client.commit();

            const escapedContent = paste.content
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");

            res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pastebin Lite - View Paste</title>
            <style>
              :root { --bg: #0f172a; --card: #1e293b; --text: #f8fafc; --muted: #94a3b8; --primary: #38bdf8; --border: #334155; }
              body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; background: var(--bg); color: var(--text); padding: 2rem; margin: 0; display: flex; justify-content: center; }
              .container { width: 100%; max-width: 800px; display: flex; flex-direction: column; gap: 1.5rem; }
              .header { border-bottom: 1px solid var(--border); padding-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; }
              h1 { font-size: 1.5rem; margin: 0; color: var(--primary); }
              .card { background: var(--card); border: 1px solid var(--border); border-radius: 0.5rem; padding: 1.5rem; }
              pre { white-space: pre-wrap; word-wrap: break-word; font-family: inherit; font-size: 1rem; margin: 0; }
              .meta { font-size: 0.75rem; color: var(--muted); margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border); }
              a { color: var(--primary); text-decoration: none; font-size: 0.875rem; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>PASTEBIN_LITE</h1>
                <a href="/">+ New Paste</a>
              </div>
              <div class="card">
                <pre>${escapedContent}</pre>
                <div class="meta">
                  Created at: ${new Date(paste.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          </body>
        </html>
      `);
        } catch (e) {
            await client.rollback();
            throw e;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Error viewing paste:", err);
        res.status(500).send("Internal Server Error");
    }
});

// GET / (Home Page UI)
router.get("/", (req, res) => {
    res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pastebin Lite - Create Paste</title>
        <style>
          :root { --bg: #0f172a; --card: #1e293b; --text: #f8fafc; --muted: #94a3b8; --primary: #38bdf8; --border: #334155; }
          body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; background: var(--bg); color: var(--text); padding: 2rem; margin: 0; display: flex; justify-content: center; }
          .container { width: 100%; max-width: 800px; display: flex; flex-direction: column; gap: 1.5rem; }
          h1 { font-size: 1.5rem; margin: 0; color: var(--primary); letter-spacing: -0.025em; }
          .header { border-bottom: 1px solid var(--border); padding-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; }
          .card { background: var(--card); border: 1px solid var(--border); border-radius: 0.5rem; padding: 1.5rem; }
          textarea { width: 100%; min-height: 300px; background: transparent; border: none; color: var(--text); font-family: inherit; font-size: 1rem; resize: vertical; outline: none; padding: 0.5rem 0; }
          .controls { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border); }
          .field { display: flex; flex-direction: column; gap: 0.5rem; }
          label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
          select, input, button { background: var(--bg); border: 1px solid var(--border); color: var(--text); padding: 0.5rem; border-radius: 0.25rem; font-family: inherit; font-size: 0.875rem; }
          button { background: var(--primary); color: #000; font-weight: bold; border: none; cursor: pointer; transition: opacity 0.2s; }
          button:hover { opacity: 0.9; }
          button:disabled { opacity: 0.5; cursor: not-allowed; }
          .success-card { background: #064e3b; border: 1px solid #059669; padding: 1.5rem; border-radius: 0.5rem; display: none; }
          .link-box { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
          .link-box input { flex: 1; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>PASTEBIN_LITE</h1>
            <label>Ephemeral Text Sharing</label>
          </div>
          <div id="create-view">
            <div class="card">
              <textarea id="content" placeholder="// Paste your content here..."></textarea>
              <div class="controls">
                <div class="field">
                  <label>Expires In</label>
                  <select id="ttl">
                    <option value="never">Never</option>
                    <option value="600">10 Minutes</option>
                    <option value="3600">1 Hour</option>
                    <option value="86400">1 Day</option>
                    <option value="604800">1 Week</option>
                  </select>
                </div>
                <div class="field">
                  <label>Max Views</label>
                  <input type="number" id="max_views" placeholder="Unlimited" min="1">
                </div>
                <div class="field" style="justify-content: flex-end;">
                  <button id="submit">Create Paste</button>
                </div>
              </div>
            </div>
          </div>
          <div id="success-view" class="success-card">
            <label style="color: #6ee7b7">Paste Created Successfully</label>
            <div class="link-box">
              <input type="text" id="result-url" readonly>
              <button id="copy-btn" style="background: #1e293b; color: var(--text); border: 1px solid var(--border);">Copy</button>
            </div>
            <button onclick="window.location.reload()" style="margin-top: 1rem; width: 100%; background: transparent; color: #6ee7b7; border: 1px solid #059669;">Create Another</button>
          </div>
        </div>
        <script>
          const submitBtn = document.getElementById('submit');
          const contentArea = document.getElementById('content');
          submitBtn.onclick = async () => {
            const content = contentArea.value.trim();
            if (!content) return alert('Content is required');
            
            submitBtn.disabled = true;
            submitBtn.innerText = 'Creating...';
            
            const payload = { content };
            const ttl = document.getElementById('ttl').value;
            const maxViews = document.getElementById('max_views').value;
            
            if (ttl !== 'never') payload.ttl_seconds = parseInt(ttl);
            if (maxViews) payload.max_views = parseInt(maxViews);
            
            try {
              const res = await fetch('/api/pastes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              const data = await res.json();
              if (res.ok) {
                document.getElementById('create-view').style.display = 'none';
                document.getElementById('success-view').style.display = 'block';
                document.getElementById('result-url').value = data.url;
              } else {
                alert(data.detail || 'Failed to create paste');
              }
            } catch (err) {
              alert('Network error');
            } finally {
              submitBtn.disabled = false;
              submitBtn.innerText = 'Create Paste';
            }
          };
          
          document.getElementById('copy-btn').onclick = () => {
            const urlInput = document.getElementById('result-url');
            urlInput.select();
            document.execCommand('copy');
            alert('Copied to clipboard!');
          };
        </script>
      </body>
    </html>
  `);
});

export default router;
