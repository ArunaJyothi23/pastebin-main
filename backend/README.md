## Pastebin Lite Backend Service

This is the backend service for Pastebin Lite, implemented using Next.js API Routes (Node.js + TypeScript) and PostgreSQL (compatible with Neon).

### 1. Database Schema (PostgreSQL / Neon)

Ensure you have a `pastes` table in your Postgres / Neon database with the following schema:

```sql
CREATE TABLE IF NOT EXISTS pastes (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NULL,
  max_views INT NULL,
  view_count INT NOT NULL DEFAULT 0
);
```

### 2. Environment Variables

Create a `.env` file in this `backend/` directory and set your PostgreSQL connection string:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME?sslmode=require"
```

- **`DATABASE_URL`**: Your connection string for the PostgreSQL database (e.g., from Neon).

### 3. Running Locally

From the `backend/` directory:

```bash
npm install   # or yarn install / pnpm install
npm run dev   # or yarn dev / pnpm dev
```

The backend API will typically run on `http://localhost:3000` (or `http://localhost:4000` if `frontend` is already running on 3000), serving API routes prefixed with `/api`.

### 4. Deterministic Time Testing

For automated testing of expiry logic, you can control the perceived "current time" by setting `TEST_MODE=1` and providing the `x-test-now-ms` header.

- **`TEST_MODE=1`**: An environment variable that enables test mode.
- **`x-test-now-ms`**: A request header containing a Unix timestamp in milliseconds. The backend will use this value instead of `Date.now()` for all time-related calculations.

**Example `.env` for testing:**

```bash
DATABASE_URL="..."
TEST_MODE=1
```

### 5. API Routes

Here are the available API routes with `curl` examples. Assume the backend is running at `http://localhost:3000` for these examples.

#### A. `GET /api/healthz`

Checks the health of the API service.

```bash
curl -X GET \
  http://localhost:3000/api/healthz
```

**Example Response (200 OK):**
```json
{
  "status": "ok"
}
```

#### B. `POST /api/pastes`

Creates a new paste.

- **Request Body (JSON)**:
  - `content`: (required, string) The paste content.
  - `ttl_seconds`: (optional, number) Time-to-live in seconds.
  - `max_views`: (optional, number) Maximum number of views before expiry.

```bash
# Example 1: Basic paste
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello World!"}' \
  http://localhost:3000/api/pastes

# Example 2: Paste with 60 seconds expiry
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"content": "Ephemeral text", "ttl_seconds": 60}' \
  http://localhost:3000/api/pastes

# Example 3: Paste with 5 max views
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"content": "View me 5 times", "max_views": 5}' \
  http://localhost:3000/api/pastes

# Example 4: Paste with deterministic time for testing
# (Assume current time is 1700000000000ms Unix epoch for expiry calculation)
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-test-now-ms: 1700000000000" \
  -d '{"content": "Test content with fixed time", "ttl_seconds": 3600}' \
  http://localhost:3000/api/pastes
```

**Example Response (201 Created):**
```json
{
  "id": "some_id",
  "url": "/p/some_id"
}
```

#### C. `GET /api/pastes/:id`

Retrieves a paste by its ID, increments its view count, and applies expiry logic. Returns 404 if not found or expired.

```bash
# Example 1: Fetch a paste
curl -X GET \
  http://localhost:3000/api/pastes/some_id

# Example 2: Fetch a paste with deterministic time for testing
# (Useful for checking if a paste expired at a specific point in time)
curl -X GET \
  -H "x-test-now-ms: 1700000000000" \
  http://localhost:3000/api/pastes/some_id
```

**Example Response (200 OK):**
```json
{
  "content": "Hello World!",
  "viewCount": 1,
  "expiresAt": null,
  "maxViews": null
}
```

**Example Response (404 Not Found):**
```json
{
  "detail": "Paste not found"
}
```
