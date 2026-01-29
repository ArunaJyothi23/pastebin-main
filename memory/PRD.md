# Pastebin Lite - Product Requirements Document

## Original Problem Statement
Allow users to create a text paste, get a shareable link, view the paste via the link. Optional expiry by time (TTL) or number of views. No authentication, no editing, no comments. Focus on correctness, API clarity, data consistency, testability.

## Architecture
- **Frontend**: React + TailwindCSS + shadcn/ui components
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **ID Generation**: NanoID (8 characters)

## User Personas
1. **Developers** - Share code snippets quickly
2. **General Users** - Share any text content with expiration

## Core Requirements
- Create paste with text content
- Optional time-based expiry (10 min, 1 hour, 1 day, 1 week)
- Optional view-based expiry (max views limit)
- Shareable short URLs using NanoID
- Copy to clipboard functionality
- Auto-delete expired pastes
- Proper HTTP status codes (404 for not found, 410 for expired)

## What's Been Implemented (January 2025)
- ✅ POST /api/paste - Create paste with content, expiresInSeconds, maxViews
- ✅ GET /api/paste/{id} - Retrieve paste with expiry checks
- ✅ Atomic view count increment
- ✅ Time-based expiry (410 Gone)
- ✅ View-based expiry (410 Gone)
- ✅ Auto-delete expired pastes
- ✅ Home page with textarea, expiry dropdown, max views input
- ✅ View paste page with content display and copy button
- ✅ Copy to clipboard with visual feedback
- ✅ Error states (404/410) with proper UI
- ✅ Dark theme with JetBrains Mono font

## Prioritized Backlog
### P0 (Critical) - DONE
- All core features implemented

### P1 (High)
- Raw text view endpoint for programmatic access
- Syntax highlighting for code pastes
- Password protection for pastes

### P2 (Medium)
- Custom short URLs
- Edit paste (requires auth)
- Download paste as file

### P3 (Low)
- Paste statistics/analytics
- QR code generation for URLs
- Burn after read confirmation

## Next Tasks
1. Add syntax highlighting option for code
2. Implement raw text endpoint (/paste/{id}/raw)
3. Add paste size limit validation
