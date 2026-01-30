import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import { pool, initDb } from "./lib/db.js";
import routes from "./src/routes.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize Database on Startup
initDb().catch(err => console.error("Critical DB Init Error:", err));

app.use(cors());
app.use(express.json());

// Mount the routes
app.use("/", routes);
app.use("/api", routes);

// Requirement: GET /api/healthz
app.get("/api/healthz", async (req, res) => {
    try {
        const client = await pool.connect();
        await client.query("SELECT 1");
        client.release();
        res.json({ ok: true });
    } catch (err) {
        console.error("Health check DB error:", err.message);
        res.status(500).json({ ok: false, detail: "Database unreachable" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
