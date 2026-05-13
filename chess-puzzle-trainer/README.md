# Chess Puzzle Trainer Full-Stack Prototype

Full-stack local prototype with:

- Frontend: React + TypeScript + Vite + Tailwind
- Backend: Node.js + Express
- Database: SQLite + Prisma
- Access mode: guest-first (no login required for puzzle play)
- Chess: chess.js + react-chessboard

## Project layout

- `./` frontend app
- `./server` backend API + Prisma schema + seed

## Features

- No login required to start training (guest mode)
- Persisted puzzle attempts and puzzle progress per user
- Daily puzzle endpoint and frontend mode
- Puzzle collections
- User profile stats
- Leaderboard by training rating
- Admin import endpoints for JSON and PGN conversion (prototype)
- SQLite persistence with Prisma migrations
- Seed with 60 puzzles

## Backend setup

```bash
cd /home/sahirvhora/projects/calculator_app/chess-puzzle-trainer/server
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Backend runs on `http://localhost:4000` by default.

Seeded users (optional for admin/auth endpoints):

- Admin: `admin@local.dev` / `password123`
- Demo: `demo@local.dev` / `password123`

## Frontend setup (no login required)

In a separate terminal:

```bash
cd /home/sahirvhora/projects/calculator_app/chess-puzzle-trainer
npm install
npm run dev
```

Frontend runs on Vite default (`http://localhost:5173` usually).

## Environment variables

### Backend (`server/.env`)

- `DATABASE_URL` (default `file:./dev.db`)
- `PORT` (default `4000`)
- `JWT_SECRET`
- `ADMIN_IMPORT_KEY`

### Frontend (optional)

If needed, set `VITE_API_URL` to explicit API host, otherwise Vite proxy `/api` -> `http://localhost:4000`.

## API overview

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/puzzles`
- `GET /api/puzzles/daily`
- `GET /api/puzzles/collections`
- `GET /api/puzzles/collections/:id/puzzles`
- `GET /api/puzzles/:id/progress`
- `POST /api/attempts`
- `GET /api/stats/me`
- `GET /api/leaderboard`
- `POST /api/admin/import/json` (admin + `x-admin-key`)
- `POST /api/admin/import/pgn` (admin + `x-admin-key`)

## Prisma notes

- Schema: `server/prisma/schema.prisma`
- Seed script: `server/prisma/seed.js`
- Use Prisma migrations via:

```bash
cd server
npx prisma migrate dev --name <migration_name>
```

## Prototype limitations

- Auth endpoints still exist for prototype/admin scenarios, but gameplay runs in guest mode
- PGN import converter is intentionally lightweight and not production-grade
- Stockfish integration is not enabled in this prototype to keep local setup stable
