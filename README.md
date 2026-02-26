# ORIN Admin Dashboard

Separate Next.js admin panel for ORIN backend operations.

## Features

- Admin login via backend JWT auth
- Pending mentor approvals
- Student list
- Demographics overview
- Send notifications to role groups
- Recent notification history

## Local setup

1. Create `.env.local` from `.env.example`.
2. Install dependencies:
   - `npm install`
3. Start:
   - `npm run dev`

## Required backend APIs

- `POST /api/auth/login`
- `GET /api/admin/pending-mentors`
- `PUT /api/admin/approve/:id`
- `GET /api/admin/students`
- `GET /api/admin/demographics`
- `GET /api/admin/notifications`
- `POST /api/admin/notifications`

All admin routes require `Authorization: Bearer <token>`.

## Vercel deployment

1. Push `orin-admin-dashboard` to GitHub.
2. Create new Vercel project from that repo.
3. Set environment variable:
   - `NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain`
4. Deploy.
