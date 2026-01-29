## Pastebin Lite – Repo Structure

- `frontend/`: Next.js (App Router) + React + TypeScript UI.
  - Uses `NEXT_PUBLIC_BACKEND_URL` to talk to the backend (see `frontend/.env.example`).
- `backend/`: Next.js API Routes (Node + TypeScript) exposing paste APIs and connecting to Postgres/Neon via `DATABASE_URL` (see `backend/.env.example`).

Recommended deployment:
- Frontend → Vercel (`frontend/`).
- Backend → Render or Vercel (`backend/`).

Configure your Neon connection string in the backend, and point `NEXT_PUBLIC_BACKEND_URL` to the deployed backend URL.

