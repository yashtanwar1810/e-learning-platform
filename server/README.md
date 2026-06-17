# Learning Assistant — Backend

Express + MongoDB + Gemini backend that powers the React frontend in this repo.

## Setup

1. `cd server`
2. `npm install`
3. `cp .env.example .env` and fill in:
   - `MONGO_URI` — MongoDB Atlas connection string
   - `JWT_SECRET` — any long random string
   - `GEMINI_API_KEY` — from https://aistudio.google.com/app/apikey
   - `GEMINI_MODEL` — optional override, defaults to `gemini-2.5-flash`
4. `npm run dev` — server runs on http://localhost:5000

The frontend defaults to `http://localhost:5000/api` (override with `VITE_API_URL`).

## Endpoints

All under `/api`. Protected routes require `Authorization: Bearer <token>`.

| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/auth/register` | – | `{ name, email, password }` |
| POST | `/auth/login` | – | `{ email, password }` |
| GET  | `/auth/me` | ✓ | – |
| GET  | `/pdfs` | ✓ | – |
| POST | `/pdfs` | ✓ | multipart `pdf` file |
| GET  | `/pdfs/:id` | ✓ | – |
| DELETE | `/pdfs/:id` | ✓ | – |
| GET  | `/pdfs/:id/summary` | ✓ | – |
| GET  | `/pdfs/:id/flashcards` | ✓ | – |
| GET  | `/pdfs/:id/quiz` | ✓ | – |

AI results are cached on the `Pdf` document after the first generation.

## Deploy

Works on any Node host (Render, Railway, Fly.io, a VPS). Set the same env vars
and point the frontend's `VITE_API_URL` at the deployed URL.
