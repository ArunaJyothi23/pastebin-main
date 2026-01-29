## Pastebin Lite – Next.js + Postgres Stack

**Tech stack now implemented in this repo (`next-app` folder):**

- **Frontend**: Next.js (App Router) + React + TypeScript
- **Backend**: Next.js API Routes (Node.js + TypeScript)
- **Database**: PostgreSQL (Neon-compatible, `DATABASE_URL` connection string)

### 1. Database schema (PostgreSQL / Neon)

Create a `pastes` table in your Postgres / Neon database:

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

### 2. Environment variables

In your local `.env` (and in Vercel / Render env settings) set:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME?sslmode=require"
NEXT_PUBLIC_FRONTEND_URL="https://your-vercel-domain.vercel.app"
```

- **`DATABASE_URL`**: Neon gives you this connection string in the dashboard.
- **`NEXT_PUBLIC_FRONTEND_URL`**: Used to build shareable paste URLs in API responses.

### 3. Running locally

From the `next-app` directory:

```bash
yarn install    # or npm install / pnpm install
yarn dev        # or npm run dev / pnpm dev
```

The app will be available at `http://localhost:3000`:

- `GET /` – create a paste (home page)
- `GET /paste/[id]` – view a paste
- `POST /api/paste` – create paste API
- `GET /api/paste/[id]` – fetch & auto-increment view count

### 4. Deployment

- **Frontend (and API routes) on Vercel**
  - Point Vercel to the `next-app` directory as the project root.
  - Set `DATABASE_URL` and `NEXT_PUBLIC_FRONTEND_URL` in Vercel project settings.
  - Vercel will build and host both the UI and the Next.js API routes.

- **Alternative: Backend on Render**
  - You can also deploy this same Next.js app to Render as a Node service:
    - Build command: `yarn install && yarn build`
    - Start command: `yarn start`
    - Set the same environment variables on Render.
  - In that setup, you may still choose to host only static/frontend on Vercel and the Node server with API routes on Render by adjusting build/export strategy, but the current code works as a single fullstack Next.js app.

### 5. Old stack

The previous **CRA frontend** (`frontend/`) and **FastAPI + MongoDB backend** (`backend/`) are still present in the repo but are no longer needed for the Next.js + Postgres stack. Once you are happy with the new stack, you can safely remove those folders.

