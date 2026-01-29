# Pastebin Lite - Deployment Guide

## Architecture
- **Frontend**: Next.js app deployed on Vercel
- **Backend**: Next.js API routes deployed on Render
- **Database**: PostgreSQL (Neon recommended)

---

## Backend Deployment (Render)

### 1. Create a Neon Database
1. Go to [neon.tech](https://neon.tech) and create a new project
2. Copy your connection string (format: `postgresql://USER:PASSWORD@HOST/DB_NAME?sslmode=require`)

### 2. Deploy to Render
1. Go to [render.com](https://render.com) and connect your GitHub repository
2. Click **New > Blueprint** and select your repo
3. Render will detect `backend/render.yaml` automatically
4. Set the **Root Directory** to `backend`
5. Add environment variable:
   - `DATABASE_URL`: Your Neon connection string
6. Deploy!

Your backend will be live at: `https://pastebin-lite-backend.onrender.com`

---

## Frontend Deployment (Vercel)

### 1. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and import your GitHub repository
2. Set **Root Directory** to `frontend`
3. Add environment variable:
   - `NEXT_PUBLIC_BACKEND_URL`: Your Render backend URL (e.g., `https://pastebin-lite-backend.onrender.com`)
4. Deploy!

Your frontend will be live at: `https://your-project.vercel.app`

---

## Environment Variables Summary

### Backend (Render)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |

### Frontend (Vercel)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_BACKEND_URL` | URL of the deployed backend API |

---

## Post-Deployment Checklist
- [ ] Verify backend health: `GET {BACKEND_URL}/api/health`
- [ ] Create a test paste from the frontend
- [ ] Verify paste retrieval works correctly
