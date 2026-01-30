# Pastebin-Lite

A minimalist "Pastebin" application built with **Node.js + Express**. This application allows users to create text pastes with optional constraints like Time-to-Live (TTL) and maximum view counts.

## Persistence Layer
I chose **PostgreSQL** as the persistence layer because:
- It ensures data survives across serverless application lifecycle (crucial for deployments on Vercel/Render).
- It supports ACID transactions, which I use to safely decrement view counts and cleanup expired pastes atomically.
- It is highly scalable and reliable for production-grade ephemeral storage.

## Features
- **Create Pastes:** Set custom TTL (seconds) and maximum view limits.
- **Dynamic Retrieval:** Automatic deletion once constraints are met.
- **Deterministic Testing:** Support for `TEST_MODE=1` using the `x-test-now-ms` header for precise expiry validation.
- **Responsive UI:** A sleek dark-mode interface for ease of use.

## Getting Started Locally

### Prerequisites
- Node.js (v18+)
- A PostgreSQL connection string (Recommended: [Neon.tech](https://neon.tech))

### Installation
1. Install dependencies:
   ```bash
   npm run install-all
   ```

2. Configure environment variables in `backend/.env`:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   PORT=4000
   TEST_MODE=1
   ```

3. Initialize Database:
   The application assumes a `pastes` table exists. Run the following SQL if not already created:
   ```sql
   CREATE TABLE pastes (
     id TEXT PRIMARY KEY,
     content TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
     expires_at TIMESTAMP WITH TIME ZONE,
     max_views INTEGER,
     views INTEGER DEFAULT 0
   );
   ```

4. Run the application:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:4000`.

## API Documentation

### Health Check
`GET /api/healthz`
- Returns HTTP 200 if the server and database are operational.

### Create Paste
`POST /api/pastes`
- **Body:** `{ "content": "...", "ttl_seconds": 3600, "max_views": 5 }`
- **Response:** `{ "id": "...", "url": "..." }`

### Fetch Paste (JSON)
`GET /api/pastes/:id`
- **Response:** `{ "content": "...", "remaining_views": 4, "expires_at": "..." }`

### View Paste (HTML)
`GET /p/:id`
- Returns a rendered HTML view of the paste.

## Important Design Decisions
- **Unified Architecture:** The frontend UI and backend API are served from the same Express instance to simplify deployment and reduce latency.
- **Atomic Cleanup:** Every time a paste is created or retrieved, the system perform checks to remove expired or exhausted pastes, keeping the database lean.
- **Safety:** All HTML content is escaped before rendering to prevent XSS.
